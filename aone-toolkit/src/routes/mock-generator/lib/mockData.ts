import { faker, fakerZH_CN } from "@faker-js/faker";
import {
    recordsToJSON,
    toCSV,
    toMarkdown,
    toSQL
} from "../../table-editor/lib/converters";
import type { TableData } from "../../table-editor/lib/types";

export type MockValue = string | number | boolean | null;

export interface FieldDefinition {
    id: string;
    name: string;
    type: string;
    isRequired?: boolean;
    nullPercentage?: number; // 0 to 100
    min?: number;
    max?: number;
    fractionDigits?: number;
    prefix?: string;
    suffix?: string;
    enumValues?: string; // Comma-separated values
    isUnique?: boolean;
}

export interface PreparedField extends FieldDefinition {
    name: string;
}

export interface MockGenerationResult {
    data: TableData;
    records: Record<string, MockValue>[];
    fields: PreparedField[];
}

export interface ValidationError {
    fieldId?: string;
    key?: string;
    message: string;
}

// Validation function
export function validateFields(fields: FieldDefinition[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const names = new Set<string>();

    fields.forEach((field, index) => {
        const fieldNum = index + 1;
        const name = field.name.trim();

        if (!name) {
            errors.push({
                fieldId: field.id,
                key: "name",
                message: `字段 #${fieldNum} 名称不能为空。`,
            });
        } else {
            const normalized = name.replace(/[^a-zA-Z0-9_]/g, "_");
            if (normalized !== name) {
                errors.push({
                    fieldId: field.id,
                    key: "name",
                    message: `字段 #${fieldNum} 名称只能包含字母、数字和下划线。`,
                });
            }
            if (names.has(name)) {
                errors.push({
                    fieldId: field.id,
                    key: "name",
                    message: `字段名称 "${name}" 重复。`,
                });
            }
            names.add(name);
        }

        // Validate range bounds
        if (field.type.startsWith("number_")) {
            if (field.min !== undefined && field.max !== undefined && Number(field.min) > Number(field.max)) {
                errors.push({
                    fieldId: field.id,
                    key: "min_max",
                    message: `字段 "${name || '#' + fieldNum}" 的最小值不能大于最大值。`,
                });
            }
        }

        // Validate enum values
        if (field.type === "enum") {
            if (!field.enumValues || !field.enumValues.trim()) {
                errors.push({
                    fieldId: field.id,
                    key: "enumValues",
                    message: `字段 "${name || '#' + fieldNum}" 的枚举值不能为空。`,
                });
            }
        }
    });

    return errors;
}

// DDL schema parser
export function parseSQLDDL(ddl: string): Partial<FieldDefinition>[] {
    const fields: Partial<FieldDefinition>[] = [];
    
    // Find body of CREATE TABLE
    const match = ddl.match(/create\s+table\s+\w+\s*\(([\s\S]*)\)/i);
    if (!match) return fields;
    
    const lines = match[1].split(",");
    lines.forEach((line) => {
        const cleaned = line.trim();
        if (!cleaned || cleaned.toUpperCase().startsWith("PRIMARY KEY") || cleaned.toUpperCase().startsWith("CONSTRAINT") || cleaned.toUpperCase().startsWith("KEY")) {
            return;
        }
        
        // Match column name and type
        const parts = cleaned.split(/\s+/);
        if (parts.length < 2) return;
        
        const colName = parts[0].replace(/[`"']/g, "");
        const colType = parts[1].toUpperCase();
        
        let type = "person_fullName";
        let min: number | undefined;
        let max: number | undefined;
        let fractionDigits: number | undefined;
        
        if (colType.includes("INT")) {
            type = "number_int";
            min = 1;
            max = 1000;
        } else if (colType.includes("DECIMAL") || colType.includes("NUMERIC") || colType.includes("FLOAT") || colType.includes("DOUBLE")) {
            type = "number_float";
            min = 0;
            max = 100;
            fractionDigits = 2;
        } else if (colType.includes("BOOL")) {
            type = "boolean";
        } else if (colType.includes("DATE") || colType.includes("TIME")) {
            type = "date_any";
        } else if (colType.includes("CHAR") || colType.includes("TEXT")) {
            const lowerName = colName.toLowerCase();
            if (lowerName.includes("email")) {
                type = "internet_email";
            } else if (lowerName.includes("phone") || lowerName.includes("mobile")) {
                type = "phone_number";
            } else if (lowerName.includes("url") || lowerName.includes("website") || lowerName.includes("link")) {
                type = "internet_url";
            } else if (lowerName.includes("company") || lowerName.includes("inc")) {
                type = "company_name";
            } else if (lowerName.includes("address") || lowerName.includes("city")) {
                type = "address_full";
            } else if (lowerName.includes("uuid")) {
                type = "string_uuid";
            } else if (lowerName.includes("id")) {
                type = "string_orderId";
            } else {
                type = "person_fullName"; // Default string mock
            }
        }
        
        fields.push({
            id: crypto.randomUUID(),
            name: colName,
            type,
            min,
            max,
            fractionDigits,
            isRequired: cleaned.toUpperCase().includes("NOT NULL") || cleaned.toUpperCase().includes("PRIMARY KEY"),
        });
    });
    
    return fields;
}

// JSON Schema / JSON parser
export function parseJSON(jsonText: string): Partial<FieldDefinition>[] {
    const fields: Partial<FieldDefinition>[] = [];
    try {
        let parsed = JSON.parse(jsonText);
        
        // Handle array of objects
        if (Array.isArray(parsed)) {
            parsed = parsed[0] || {};
        }
        
        // If it's a JSON Schema
        if (parsed.type === "object" && parsed.properties) {
            const requiredFields = new Set<string>(parsed.required || []);
            Object.keys(parsed.properties).forEach((key) => {
                const prop = parsed.properties[key];
                let type = "person_fullName";
                
                if (prop.type === "integer") {
                    type = "number_int";
                } else if (prop.type === "number") {
                    type = "number_float";
                } else if (prop.type === "boolean") {
                    type = "boolean";
                } else if (prop.type === "array") {
                    type = "array_simple";
                } else if (prop.type === "object") {
                    type = "json_object";
                } else if (prop.type === "string") {
                    if (prop.format === "uuid") type = "string_uuid";
                    else if (prop.format === "email") type = "internet_email";
                    else if (prop.format === "date-time" || prop.format === "date") type = "date_any";
                    else {
                        const lowerKey = key.toLowerCase();
                        if (lowerKey.includes("email")) type = "internet_email";
                        else if (lowerKey.includes("phone") || lowerKey.includes("mobile")) type = "phone_number";
                        else if (lowerKey.includes("url") || lowerKey.includes("website")) type = "internet_url";
                        else if (lowerKey.includes("company")) type = "company_name";
                        else if (lowerKey.includes("address")) type = "address_full";
                        else type = "person_fullName";
                    }
                }
                
                fields.push({
                    id: crypto.randomUUID(),
                    name: key,
                    type,
                    isRequired: requiredFields.has(key),
                });
            });
            return fields;
        }
        
        // Standard JSON Object
        Object.keys(parsed).forEach((key) => {
            const val = parsed[key];
            let type = "person_fullName";
            
            if (typeof val === "number") {
                type = Number.isInteger(val) ? "number_int" : "number_float";
            } else if (typeof val === "boolean") {
                type = "boolean";
            } else if (Array.isArray(val)) {
                type = "array_simple";
            } else if (val !== null && typeof val === "object") {
                type = "json_object";
            } else if (typeof val === "string") {
                const lowerKey = key.toLowerCase();
                if (val.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                    type = "string_uuid";
                } else if (val.includes("@") && val.includes(".")) {
                    type = "internet_email";
                } else if (!isNaN(Date.parse(val))) {
                    type = "date_any";
                } else if (lowerKey.includes("phone") || lowerKey.includes("mobile")) {
                    type = "phone_number";
                } else if (lowerKey.includes("url") || val.startsWith("http")) {
                    type = "internet_url";
                } else if (lowerKey.includes("company")) {
                    type = "company_name";
                } else if (lowerKey.includes("address")) {
                    type = "address_full";
                } else {
                    type = "person_fullName";
                }
            }
            
            fields.push({
                id: crypto.randomUUID(),
                name: key,
                type,
                isRequired: true,
            });
        });
        
    } catch (e) {
        // Silent error
    }
    return fields;
}

// Generate value for a single cell, with optional anomaly simulation
function generateCell(
    field: FieldDefinition,
    index: number,
    locale: "en" | "zh",
    uniqueSet?: Set<any>,
    anomalyMode?: boolean
): MockValue {
    const f = locale === "zh" ? fakerZH_CN : faker;
    
    // 1. Check nullability
    if (!field.isRequired && field.nullPercentage !== undefined && field.nullPercentage > 0) {
        const randVal = f.number.float({ min: 0, max: 100 });
        if (randVal < field.nullPercentage) {
            return null;
        }
    }
    
    // 2. Anomaly Injection Logic (30% chance if anomalyMode is enabled)
    if (anomalyMode) {
        const randVal = f.number.float({ min: 0, max: 100 });
        if (randVal < 30) {
            const numAnomalies = [0, -1, NaN, Infinity, 9007199254740991, null];
            const strAnomalies = [
                "<script>alert('XSS')</script>", // XSS injection
                "<img src=x onerror=alert(1)>",
                "' OR '1'='1' --", // SQL injection
                "\" OR 1=1 /*",
                "   ", // whitespace string
                "", // empty string
                f.string.sample(800) // overflow long string
            ];
            
            if (field.type.startsWith("number_")) {
                const pick = f.helpers.arrayElement(numAnomalies);
                if (pick === null) return null;
                if (typeof pick === "number" && isNaN(pick)) return "NaN"; // output string representation for NaN
                if (pick === Infinity) return "Infinity";
                return pick;
            }
            
            if (field.type === "internet_email" || field.type === "internet_ipv4" || field.type === "internet_ipv6") {
                return f.helpers.arrayElement(["invalid-email", "admin@", "@domain.com", "256.300.999.1", "g:h:i::j"]);
            }
            
            if (field.type === "internet_url") {
                return f.helpers.arrayElement(["invalid_url", "javascript:alert(1)", "ftp://localhost"]);
            }
            
            if (field.type.startsWith("date_")) {
                return f.helpers.arrayElement(["1970-01-01T00:00:00.000Z", "invalid-date-string", ""]);
            }
            
            if (field.type === "enum") {
                return "undefined_option";
            }
            
            if (field.type === "json_object") {
                return "{ malformed_json: ";
            }
            
            if (field.type === "array_simple") {
                return "[1, 2, malformed_array_";
            }
            
            // Standard string/text fields
            return f.helpers.arrayElement(strAnomalies);
        }
    }
    
    // Helper to run actual faker generation
    const runFaker = (): MockValue => {
        switch (field.type) {
            case "string_uuid":
                return f.string.uuid();
            case "number_int":
                return f.number.int({ min: field.min ?? 1, max: field.max ?? 1000 });
            case "number_float": {
                const floatVal = f.number.float({ min: field.min ?? 0, max: field.max ?? 1 });
                return parseFloat(floatVal.toFixed(field.fractionDigits ?? 2));
            }
            case "number_currency": {
                const amt = f.finance.amount({ min: field.min ?? 10, max: field.max ?? 10000, dec: field.fractionDigits ?? 2 });
                return parseFloat(amt);
            }
            case "boolean":
                return f.datatype.boolean();
            case "person_fullName":
                return f.person.fullName();
            case "person_firstName":
                return f.person.firstName();
            case "person_lastName":
                return f.person.lastName();
            case "person_jobTitle":
                return f.person.jobTitle();
            case "internet_email":
                return f.internet.email();
            case "phone_number":
                return f.phone.number();
            case "internet_userName":
                return f.internet.username();
            case "internet_url":
                return f.internet.url();
            case "address_full":
                return f.location.streetAddress(true);
            case "company_name":
                return f.company.name();
            case "company_catchPhrase":
                return f.company.catchPhrase();
            case "date_past":
                return f.date.past().toISOString();
            case "date_future":
                return f.date.future().toISOString();
            case "date_any":
                return f.date.between({ from: "2020-01-01", to: "2030-12-31" }).toISOString();
            case "enum": {
                if (!field.enumValues) return "";
                const items = field.enumValues.split(",").map(v => v.trim()).filter(Boolean);
                if (items.length === 0) return "";
                return f.helpers.arrayElement(items);
            }
            case "string_orderId":
                return f.string.alphanumeric({ length: 12, casing: "upper" });
            case "json_object":
                return JSON.stringify({
                    id: index + 1,
                    status: f.helpers.arrayElement(["pending", "completed", "failed"]),
                    amount: parseFloat(f.finance.amount({ min: 10, max: 200, dec: 2 })),
                    created_at: f.date.recent().toISOString().split("T")[0]
                });
            case "array_simple":
                return JSON.stringify([f.word.noun(), f.word.noun(), f.word.noun()]);
            // Iteration 3 additional types
            case "system_filePath":
                return f.system.filePath();
            case "system_fileName":
                return f.system.fileName();
            case "system_fileExt":
                return f.system.fileExt();
            case "internet_ipv4":
                return f.internet.ipv4();
            case "internet_ipv6":
                return f.internet.ipv6();
            case "internet_mac":
                return f.internet.mac();
            case "color_hex":
                return f.color.rgb();
            case "color_human":
                return f.color.human();
            case "animal_type":
                return f.animal.type();
            default:
                return "";
        }
    };
    
    // Unique check loops
    let val = runFaker();
    if (field.isUnique && uniqueSet) {
        let attempts = 0;
        while (uniqueSet.has(val) && attempts < 100) {
            val = runFaker();
            attempts++;
        }
        uniqueSet.add(val);
    }
    
    // Apply prefix/suffix if value is not null and is string-like
    if (val !== null && (field.prefix || field.suffix)) {
        val = `${field.prefix || ""}${val}${field.suffix || ""}`;
    }
    
    return val;
}

export function normalizeIdentifier(value: string, fallback: string) {
    const cleaned = value
        .trim()
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .replace(/^_+|_+$/g, "");
    if (!cleaned) return fallback;
    return /^[a-zA-Z_]/.test(cleaned) ? cleaned : `field_${cleaned}`;
}

export function prepareFields(fields: FieldDefinition[]) {
    const seen = new Set<string>();
    return fields.map((field, index) => {
        let name = normalizeIdentifier(field.name, `field_${index + 1}`);
        let suffix = 2;
        while (seen.has(name)) {
            name = `${name}_${suffix++}`;
        }
        seen.add(name);
        return { ...field, name };
    });
}

function stringifyValue(value: MockValue) {
    return value === null ? "" : String(value);
}

export function generateMockData(
    fields: FieldDefinition[],
    rowCount: number,
    locale: "en" | "zh" = "zh",
    seed?: number,
    anomalyMode?: boolean
): MockGenerationResult {
    const preparedFields = prepareFields(fields);
    const data: TableData = [];
    const header = preparedFields.map((field) => field.name);
    const records: Record<string, MockValue>[] = [];

    // Seed faker instances
    if (seed !== undefined && !isNaN(seed)) {
        faker.seed(seed);
        fakerZH_CN.seed(seed);
    } else {
        const randSeed = Math.floor(Math.random() * 1000000);
        faker.seed(randSeed);
        fakerZH_CN.seed(randSeed);
    }

    data.push(header);

    // Track uniqueness
    const uniqueSets: Record<string, Set<any>> = {};
    preparedFields.forEach((field) => {
        if (field.isUnique) {
            uniqueSets[field.id] = new Set();
        }
    });

    for (let i = 0; i < rowCount; i++) {
        const record: Record<string, MockValue> = {};
        const row = preparedFields.map((field) => {
            const val = generateCell(field, i, locale, uniqueSets[field.id], anomalyMode);
            record[field.name] = val;
            return stringifyValue(val);
        });
        data.push(row);
        records.push(record);
    }

    return { data, records, fields: preparedFields };
}

export function getMockExportText(
    format: "json" | "csv" | "sql" | "markdown" | "typescript",
    tableName: string,
    data: TableData,
    records: Record<string, MockValue>[],
    fields: PreparedField[],
) {
    switch (format) {
        case "json":
            return recordsToJSON(records);
        case "csv":
            return toCSV(data);
        case "sql":
            return toSQL(data, tableName);
        case "markdown":
            return toMarkdown(data);
        case "typescript": {
            const props = fields.map((f) => {
                let typeStr = "any";
                if (f.type.startsWith("number_")) typeStr = "number";
                else if (f.type === "boolean") typeStr = "boolean";
                else if (f.type.startsWith("date_")) typeStr = "string";
                else if (f.type === "json_object") typeStr = "Record<string, any>";
                else if (f.type === "array_simple") typeStr = "any[]";
                else if (f.type === "enum") {
                    if (f.enumValues) {
                        typeStr = f.enumValues.split(",").map(v => `'${v.trim()}'`).join(" | ");
                    } else {
                        typeStr = "string";
                    }
                } else {
                    typeStr = "string";
                }
                const optionalStr = f.isRequired ? "" : "?";
                return `  ${f.name}${optionalStr}: ${typeStr}${f.isRequired ? "" : " | null"};`;
            }).join("\n");
            const interfaceName = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/[^a-zA-Z0-9]/g, "");
            return `export interface ${interfaceName || "MockData"} {\n${props}\n}`;
        }
    }
}
