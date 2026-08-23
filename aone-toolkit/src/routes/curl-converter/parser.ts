export interface ParsedRequest {
    method: string;
    url: string;
    queryParams: { key: string; value: string }[];
    headers: { key: string; value: string }[];
    cookies: { key: string; value: string }[];
    body: string;
    bodyType: 'json' | 'form-data' | 'url-encoded' | 'raw' | 'none';
    formData: { key: string; value: string; isFile: boolean; fileName?: string }[];
    auth: {
        type: 'basic' | 'bearer' | 'none';
        username?: string;
        password?: string;
        token?: string;
    };
    error?: string;
    errorSuggestions?: string[];
}

/**
 * Parses cookie string into key-value pairs
 */
function parseCookieString(cookieStr: string, cookiesList: { key: string; value: string }[]) {
    cookieStr.split(';').forEach(c => {
        const eq = c.indexOf('=');
        if (eq !== -1) {
            cookiesList.push({
                key: c.slice(0, eq).trim(),
                value: c.slice(eq + 1).trim()
            });
        } else if (c.trim()) {
            cookiesList.push({
                key: c.trim(),
                value: ''
            });
        }
    });
}

/**
 * State-machine based shell argument splitter that respects quotes and escape characters
 */
function splitArguments(cmd: string): string[] {
    const args: string[] = [];
    let current = "";
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escaped = false;

    for (let i = 0; i < cmd.length; i++) {
        const char = cmd[i];

        if (escaped) {
            current += char;
            escaped = false;
            continue;
        }

        if (char === '\\' && !inSingleQuote) {
            escaped = true;
            continue;
        }

        if (char === "'" && !inDoubleQuote) {
            inSingleQuote = !inSingleQuote;
            continue;
        }

        if (char === '"' && !inSingleQuote) {
            inDoubleQuote = !inDoubleQuote;
            continue;
        }

        if ((char === ' ' || char === '\t' || char === '\r' || char === '\n') && !inSingleQuote && !inDoubleQuote) {
            if (current) {
                args.push(current);
                current = "";
            }
            continue;
        }

        current += char;
    }

    if (current) {
        args.push(current);
    }

    return args;
}

/**
 * Main cURL parsing logic
 */
export function parseCurl(curl: string): ParsedRequest {
    const result: ParsedRequest = {
        method: '',
        url: '',
        queryParams: [],
        headers: [],
        cookies: [],
        body: '',
        bodyType: 'none',
        formData: [],
        auth: { type: 'none' }
    };

    if (!curl.trim()) {
        return result;
    }

    const curlIndex = curl.indexOf('curl');
    if (curlIndex === -1) {
        result.error = "未找到以 'curl' 开头的命令。请确保您复制了完整的 cURL 请求。";
        result.errorSuggestions = [
            "检查复制的文本是否完整",
            "确保命令行以 'curl ' 开头"
        ];
        return result;
    }

    // Clean up continuation lines (Linux \, Windows CMD ^, and PowerShell `)
    const cleaned = curl.slice(curlIndex).replace(/\\\r?\n/g, ' ').replace(/\^\r?\n/g, ' ').replace(/`\r?\n/g, ' ');
    const args = splitArguments(cleaned);

    let method = '';
    let url = '';
    const headers: { key: string; value: string }[] = [];
    const cookies: { key: string; value: string }[] = [];
    let rawBody = '';
    const formData: { key: string; value: string; isFile: boolean; fileName?: string }[] = [];
    let authUsername = '';
    let authPassword = '';
    let authToken = '';
    let authType: 'basic' | 'bearer' | 'none' = 'none';
    let hasBodyFlag = false;
    let hasFormFlag = false;

    const optionsWithArgs = new Set([
        '-X', '--request',
        '-H', '--header',
        '-d', '--data', '--data-raw', '--data-binary', '--data-ascii', '--data-urlencode',
        '-F', '--form', '--form-string',
        '-b', '--cookie',
        '-u', '--user',
        '-A', '--user-agent',
        '-e', '--referer',
        '--url',
        '-o', '--output',
        '-m', '--max-time',
        '--connect-timeout',
        '--retry',
    ]);

    for (let i = 1; i < args.length; i++) {
        const arg = args[i];

        if (arg === '-X' || arg === '--request') {
            method = args[++i]?.toUpperCase() || '';
        } else if (arg === '-H' || arg === '--header') {
            const headerStr = args[++i] || '';
            const colonIdx = headerStr.indexOf(':');
            if (colonIdx !== -1) {
                const key = headerStr.slice(0, colonIdx).trim();
                const value = headerStr.slice(colonIdx + 1).trim();
                
                if (key.toLowerCase() === 'cookie') {
                    parseCookieString(value, cookies);
                } else if (key.toLowerCase() === 'authorization') {
                    headers.push({ key, value });
                    if (value.toLowerCase().startsWith('bearer ')) {
                        authType = 'bearer';
                        authToken = value.slice(7).trim();
                    }
                } else {
                    headers.push({ key, value });
                }
            }
        } else if (arg.startsWith('-d') || arg === '--data' || arg === '--data-raw' || arg === '--data-binary' || arg === '--data-ascii' || arg === '--data-urlencode') {
            hasBodyFlag = true;
            const val = args[++i] || '';
            if (rawBody) {
                rawBody += '&' + val;
            } else {
                rawBody = val;
            }
        } else if (arg === '-F' || arg === '--form' || arg === '--form-string') {
            hasFormFlag = true;
            const val = args[++i] || '';
            const eqIdx = val.indexOf('=');
            if (eqIdx !== -1) {
                const key = val.slice(0, eqIdx).trim();
                const value = val.slice(eqIdx + 1).trim();
                const isFile = value.startsWith('@');
                const fileName = isFile ? value.slice(1) : undefined;
                formData.push({ key, value, isFile, fileName });
            }
        } else if (arg === '-b' || arg === '--cookie') {
            const val = args[++i] || '';
            parseCookieString(val, cookies);
        } else if (arg === '-u' || arg === '--user') {
            const val = args[++i] || '';
            const colonIdx = val.indexOf(':');
            authType = 'basic';
            if (colonIdx !== -1) {
                authUsername = val.slice(0, colonIdx);
                authPassword = val.slice(colonIdx + 1);
            } else {
                authUsername = val;
            }
        } else if (arg === '-A' || arg === '--user-agent') {
            headers.push({ key: 'User-Agent', value: args[++i] || '' });
        } else if (arg === '-e' || arg === '--referer') {
            headers.push({ key: 'Referer', value: args[++i] || '' });
        } else if (arg === '--url') {
            url = args[++i] || '';
        } else if (arg.startsWith('-')) {
            if (optionsWithArgs.has(arg)) {
                i++;
            }
        } else {
            if (!url) {
                url = arg;
            }
        }
    }

    // Default method logic
    if (!method) {
        method = (hasBodyFlag || hasFormFlag) ? 'POST' : 'GET';
    }

    if (!url) {
        result.error = "未检测到请求的 URL 地址。";
        result.errorSuggestions = [
            "确保您的 cURL 命令行中包含有效的目标地址，例如: https://api.example.com",
            "检查 URL 是否正确地包裹在单引号或双引号中",
            "检查是否有多余的换行符或空格破坏了 URL 字符串"
        ];
        return result;
    }

    // Clean URL
    url = url.trim().replace(/^['"]|['"]$/g, '');

    // Parse Query Params
    const queryParams: { key: string; value: string }[] = [];
    try {
        const urlObj = new URL(url.startsWith('http') ? url : 'http://' + url);
        urlObj.searchParams.forEach((val, key) => {
            queryParams.push({ key, value: val });
        });
    } catch (e) {
        const qIndex = url.indexOf('?');
        if (qIndex !== -1) {
            const qStr = url.slice(qIndex + 1);
            qStr.split('&').forEach(p => {
                const eq = p.indexOf('=');
                if (eq !== -1) {
                    queryParams.push({
                        key: decodeURIComponent(p.slice(0, eq)),
                        value: decodeURIComponent(p.slice(eq + 1))
                    });
                } else if (p) {
                    queryParams.push({ key: decodeURIComponent(p), value: '' });
                }
            });
        }
    }

    // Add Basic Auth Header if applicable
    if (authType === 'basic' && authUsername) {
        try {
            const encoded = btoa(unescape(encodeURIComponent(`${authUsername}:${authPassword}`)));
            headers.push({ key: 'Authorization', value: `Basic ${encoded}` });
        } catch (_) {}
    }

    // Detect body type
    let bodyType: 'json' | 'form-data' | 'url-encoded' | 'raw' | 'none' = 'none';
    if (hasFormFlag) {
        bodyType = 'form-data';
    } else if (rawBody) {
        try {
            JSON.parse(rawBody);
            bodyType = 'json';
        } catch {
            if (rawBody.includes('=') || rawBody.includes('&')) {
                bodyType = 'url-encoded';
            } else {
                bodyType = 'raw';
            }
        }
    }

    // Check for obvious syntax anomalies
    const errorSuggestions: string[] = [];
    const unclosedQuotes = (curl.match(/'/g) || []).length % 2 !== 0 || (curl.match(/"/g) || []).length % 2 !== 0;
    if (unclosedQuotes) {
        result.error = '命令行中可能存在未闭合的单引号或双引号。';
        errorSuggestions.push(
            '检查所有的成对引号，确保每个单引号 (\') 或双引号 (") 都已正确闭合',
            '如果请求参数中包含引号，请使用反斜杠 (\\) 进行转义，或者更换外层包裹的引号'
        );
    }
    const badLineContinuations = curl.includes('\\') && !curl.includes('\n') && !curl.includes('\r');
    if (badLineContinuations) {
        result.error = '检测到可能存在错误的换行转义符。';
        errorSuggestions.push(
            '如果在 Windows 命令提示符 (CMD) 中使用，换行转义符应该是 ^ 而不是 \\',
            '请确保 \\ 后面紧跟着换行符，而不是多余的空格或字符'
        );
    }

    if (result.error) {
        result.errorSuggestions = errorSuggestions;
    }

    return {
        method,
        url,
        queryParams,
        headers,
        cookies,
        body: rawBody,
        bodyType,
        formData,
        auth: {
            type: authType,
            username: authUsername || undefined,
            password: authPassword || undefined,
            token: authToken || undefined
        },
        error: result.error,
        errorSuggestions: result.errorSuggestions
    };
}

/**
 * Generates reusable code snippet for target language/client
 */
export function generateCode(req: ParsedRequest, lang: string, indent: number = 2): string {
    if (!req.url) {
        return '// 粘贴有效的 curl 命令以生成代码';
    }

    const space = ' '.repeat(indent);

    // Format headers as key-value map
    const headersMap: Record<string, string> = {};
    req.headers.forEach(h => {
        headersMap[h.key] = h.value;
    });
    // Add cookies to headers if cookies are parsed and Cookie header is not manually set
    if (req.cookies.length > 0 && !headersMap['Cookie'] && !headersMap['cookie']) {
        headersMap['Cookie'] = req.cookies.map(c => `${c.key}=${c.value}`).join('; ');
    }

    switch (lang) {
        case 'fetch':
            return generateFetch(req, headersMap, space);
        case 'axios':
            return generateAxios(req, headersMap, space);
        case 'python':
            return generatePython(req, headersMap, space);
        case 'go':
            return generateGo(req, headersMap, space);
        case 'java':
            return generateJava(req, headersMap, space);
        case 'php':
            return generatePHP(req, headersMap, space);
        case 'ruby':
            return generateRuby(req, headersMap, space);
        case 'csharp':
            return generateCSharp(req, headersMap, space);
        default:
            return '';
    }
}

function generateFetch(req: ParsedRequest, headers: Record<string, string>, space: string): string {
    const hasHeaders = Object.keys(headers).length > 0;

    let code = `const myHeaders = new Headers();\n`;
    Object.entries(headers).forEach(([k, v]) => {
        code += `myHeaders.append("${k}", "${v.replace(/"/g, '\\"')}");\n`;
    });
    code += `\n`;

    if (req.bodyType === 'form-data') {
        code += `const formdata = new FormData();\n`;
        req.formData.forEach(fd => {
            if (fd.isFile) {
                code += `formdata.append("${fd.key}", fileInput.files[0], "${fd.fileName || 'file'}");\n`;
            } else {
                code += `formdata.append("${fd.key}", "${fd.value.replace(/"/g, '\\"')}");\n`;
            }
        });
        code += `\n`;
    }

    code += `const requestOptions = {\n`;
    code += `${space}method: "${req.method}",\n`;
    if (hasHeaders) {
        code += `${space}headers: myHeaders,\n`;
    }
    
    if (req.bodyType === 'json') {
        try {
            const parsedJson = JSON.parse(req.body);
            code += `${space}body: JSON.stringify(${JSON.stringify(parsedJson, null, 2).replace(/\n/g, '\n' + space)}),\n`;
        } catch {
            code += `${space}body: JSON.stringify(${req.body}),\n`;
        }
    } else if (req.bodyType === 'form-data') {
        code += `${space}body: formdata,\n`;
    } else if (req.bodyType === 'url-encoded' || req.bodyType === 'raw') {
        code += `${space}body: "${req.body.replace(/\n/g, '\\n').replace(/"/g, '\\"')}",\n`;
    }
    
    code += `${space}redirect: "follow"\n`;
    code += `};\n\n`;
    
    code += `fetch("${req.url}", requestOptions)\n`;
    code += `${space}.then((response) => response.text())\n`;
    code += `${space}.then((result) => console.log(result))\n`;
    code += `${space}.catch((error) => console.error(error));`;

    return code;
}

function generateAxios(req: ParsedRequest, headers: Record<string, string>, space: string): string {
    let code = `const axios = require('axios');\n`;
    const hasHeaders = Object.keys(headers).length > 0;
    
    if (req.bodyType === 'form-data') {
        code += `const FormData = require('form-data');\n`;
        code += `const fs = require('fs');\n`;
        code += `const data = new FormData();\n`;
        req.formData.forEach(fd => {
            if (fd.isFile) {
                code += `data.append('${fd.key}', fs.createReadStream('${fd.fileName || '/path/to/file'}'));\n`;
            } else {
                code += `data.append('${fd.key}', '${fd.value.replace(/'/g, "\\'")}');\n`;
            }
        });
        code += `\n`;
    } else if (req.bodyType === 'json') {
        try {
            const parsed = JSON.parse(req.body);
            code += `let data = ${JSON.stringify(parsed, null, 2)};\n\n`;
        } catch {
            code += `let data = '${req.body.replace(/'/g, "\\'")}';\n\n`;
        }
    } else if (req.bodyType === 'url-encoded') {
        code += `const qs = require('qs');\n`;
        const params: Record<string, string> = {};
        req.body.split('&').forEach(p => {
            const eq = p.indexOf('=');
            if (eq !== -1) params[decodeURIComponent(p.slice(0, eq))] = decodeURIComponent(p.slice(eq+1));
        });
        code += `let data = qs.stringify(${JSON.stringify(params, null, 2)});\n\n`;
    } else if (req.bodyType === 'raw') {
        code += `let data = '${req.body.replace(/'/g, "\\'")}';\n\n`;
    }

    code += `let config = {\n`;
    code += `${space}method: '${req.method.toLowerCase()}',\n`;
    code += `${space}maxBodyLength: Infinity,\n`;
    code += `${space}url: '${req.url}',\n`;
    
    if (hasHeaders) {
        code += `${space}headers: {\n`;
        if (req.bodyType === 'form-data') {
            code += `${space}${space}...data.getHeaders(),\n`;
        }
        Object.entries(headers).forEach(([k, v], idx, arr) => {
            code += `${space}${space}'${k}': '${v.replace(/'/g, "\\'")}'${idx === arr.length - 1 ? '' : ','}\n`;
        });
        code += `${space}},\n`;
    }

    if (req.bodyType !== 'none') {
        code += `${space}data : data\n`;
    } else {
        code = code.replace(/,\n$/, '\n');
    }

    code += `};\n\n`;
    code += `axios.request(config)\n`;
    code += `${space}.then((response) => {\n`;
    code += `${space}${space}console.log(JSON.stringify(response.data));\n`;
    code += `${space}})\n`;
    code += `${space}.catch((error) => {\n`;
    code += `${space}${space}console.log(error);\n`;
    code += `${space}});`;

    return code;
}

function generatePython(req: ParsedRequest, headers: Record<string, string>, space: string): string {
    let code = `import requests\n`;
    if (req.bodyType === 'json') {
        code += `import json\n`;
    }
    code += `\nurl = "${req.url}"\n\n`;

    const hasHeaders = Object.keys(headers).length > 0;
    const hasBody = req.bodyType !== 'none';

    if (req.bodyType === 'form-data') {
        code += `payload = {}\n`;
        code += `files = [\n`;
        req.formData.forEach(fd => {
            if (fd.isFile) {
                code += `${space}('${fd.key}', ('${fd.fileName ? fd.fileName.split('/').pop() : 'file'}', open('${fd.fileName || '/path/to/file'}', 'rb'), 'application/octet-stream')),\n`;
            } else {
                code += `${space}('${fd.key}', (None, '${fd.value}')),\n`;
            }
        });
        if (req.formData.length > 0) {
            code = code.slice(0, -2) + '\n';
        }
        code += `]\n`;
    } else if (req.bodyType === 'json') {
        try {
            const parsed = JSON.parse(req.body);
            code += `payload = json.dumps(${JSON.stringify(parsed, null, 4).replace(/true/g, 'True').replace(/false/g, 'False').replace(/null/g, 'None')})\n`;
        } catch {
            code += `payload = json.dumps("${req.body.replace(/"/g, '\\"')}")\n`;
        }
    } else if (req.bodyType === 'url-encoded' || req.bodyType === 'raw') {
        code += `payload = "${req.body.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"\n`;
    }

    if (hasHeaders) {
        code += `headers = {\n`;
        Object.entries(headers).forEach(([k, v]) => {
            code += `${space}'${k}': '${v.replace(/'/g, "\\'")}',\n`;
        });
        code += `}\n\n`;
    } else {
        code += `headers = {}\n\n`;
    }

    code += `response = requests.request(\n`;
    code += `${space}"${req.method}",\n`;
    code += `${space}url,\n`;
    code += `${space}headers=headers,\n`;
    if (req.bodyType === 'form-data') {
        code += `${space}data=payload,\n`;
        code += `${space}files=files\n`;
    } else if (hasBody) {
        code += `${space}data=payload\n`;
    } else {
        code = code.slice(0, -2) + '\n';
    }
    code += `)\n\n`;
    code += `print(response.text)\n`;

    return code;
}

function generateGo(req: ParsedRequest, headers: Record<string, string>, space: string): string {
    let code = `package main\n\nimport (\n${space}"fmt"\n`;
    if (req.bodyType === 'form-data') {
        code += `${space}"bytes"\n${space}"mime/multipart"\n${space}"os"\n${space}"path/filepath"\n`;
    } else if (req.bodyType !== 'none') {
        code += `${space}"strings"\n`;
    }
    code += `${space}"net/http"\n${space}"io"\n)\n\nfunc main() {\n`;
    code += `${space}url := "${req.url}"\n`;
    code += `${space}method := "${req.method}"\n\n`;

    if (req.bodyType === 'form-data') {
        code += `${space}payload := &bytes.Buffer{}\n`;
        code += `${space}writer := multipart.NewWriter(payload)\n`;
        req.formData.forEach(fd => {
            if (fd.isFile) {
                code += `${space}file, errFile${fd.key} := os.Open("${fd.fileName || '/path/to/file'}")\n`;
                code += `${space}defer file.Close()\n`;
                code += `${space}part${fd.key}, errFile${fd.key} := writer.CreateFormFile("${fd.key}", filepath.Base("${fd.fileName || 'file'}"))\n`;
                code += `${space}_, errFile${fd.key} = io.Copy(part${fd.key}, file)\n`;
            } else {
                code += `${space}_ = writer.WriteField("${fd.key}", "${fd.value.replace(/"/g, '\\"')}")\n`;
            }
        });
        code += `${space}err := writer.Close()\n`;
        code += `${space}if err != nil {\n${space}${space}fmt.Println(err)\n${space}${space}return\n${space}}\n\n`;
    } else if (req.bodyType !== 'none') {
        code += `${space}payload := strings.NewReader(\`${req.body.replace(/`/g, "'")}\`)\n\n`;
    }

    code += `${space}client := &http.Client{}\n`;
    if (req.bodyType === 'form-data') {
        code += `${space}req, err := http.NewRequest(method, url, payload)\n`;
    } else if (req.bodyType !== 'none') {
        code += `${space}req, err := http.NewRequest(method, url, payload)\n`;
    } else {
        code += `${space}req, err := http.NewRequest(method, url, nil)\n`;
    }
    code += `${space}if err != nil {\n${space}${space}fmt.Println(err)\n${space}${space}return\n${space}}\n`;

    // Add headers
    Object.entries(headers).forEach(([k, v]) => {
        if (req.bodyType === 'form-data' && k.toLowerCase() === 'content-type') {
            return;
        }
        code += `${space}req.Header.Add("${k}", "${v.replace(/"/g, '\\"')}")\n`;
    });
    if (req.bodyType === 'form-data') {
        code += `${space}req.Header.Add("Content-Type", writer.FormDataContentType())\n`;
    }
    code += `\n`;

    code += `${space}res, err := client.Do(req)\n`;
    code += `${space}if err != nil {\n${space}${space}fmt.Println(err)\n${space}${space}return\n${space}}\n`;
    code += `${space}defer res.Body.Close()\n\n`;
    code += `${space}body, err := io.ReadAll(res.Body)\n`;
    code += `${space}if err != nil {\n${space}${space}fmt.Println(err)\n${space}${space}return\n${space}}\n`;
    code += `${space}fmt.Println(string(body))\n}`;

    return code;
}

function generateJava(req: ParsedRequest, headers: Record<string, string>, space: string): string {
    let code = `import java.io.IOException;\nimport java.net.URI;\nimport java.net.http.HttpClient;\nimport java.net.http.HttpRequest;\nimport java.net.http.HttpResponse;\n`;
    code += `\npublic class App {\n`;
    code += `${space}public static void main(String[] args) throws IOException, InterruptedException {\n`;
    code += `${space}${space}HttpClient client = HttpClient.newHttpClient();\n`;

    if (req.bodyType === 'form-data') {
        code += `${space}${space}// 注意：Java 11 HttpClient 原生不支持 Multipart 表单，建议引入 Apache HttpClient 或 OkHttp\n`;
    }

    code += `${space}${space}HttpRequest request = HttpRequest.newBuilder()\n`;
    code += `${space}${space}${space}${space}.uri(URI.create("${req.url}"))\n`;

    // Add headers
    Object.entries(headers).forEach(([k, v]) => {
        code += `${space}${space}${space}${space}.header("${k}", "${v.replace(/"/g, '\\"')}")\n`;
    });

    // Add Method & Body
    const methodUpper = req.method.toUpperCase();
    if (req.bodyType === 'none') {
        if (methodUpper === 'GET') {
            code += `${space}${space}${space}${space}.GET()\n`;
        } else if (methodUpper === 'DELETE') {
            code += `${space}${space}${space}${space}.DELETE()\n`;
        } else {
            code += `${space}${space}${space}${space}.method("${methodUpper}", HttpRequest.BodyPublishers.noBody())\n`;
        }
    } else if (req.bodyType === 'json' || req.bodyType === 'url-encoded' || req.bodyType === 'raw') {
        const bodyContent = req.body.replace(/"/g, '\\"').replace(/\n/g, '\\n');
        code += `${space}${space}${space}${space}.method("${methodUpper}", HttpRequest.BodyPublishers.ofString("${bodyContent}"))\n`;
    } else if (req.bodyType === 'form-data') {
        code += `${space}${space}${space}${space}.method("${methodUpper}", HttpRequest.BodyPublishers.ofString("--boundary..."))\n`;
    }

    code += `${space}${space}${space}${space}.build();\n\n`;
    code += `${space}${space}HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());\n`;
    code += `${space}${space}System.out.println(response.body());\n`;
    code += `${space}}\n}`;

    return code;
}

function generatePHP(req: ParsedRequest, headers: Record<string, string>, space: string): string {
    let code = `<?php\n\n$curl = curl_init();\n\ncurl_setopt_array($curl, array(\n`;
    code += `${space}CURLOPT_URL => '${req.url}',\n`;
    code += `${space}CURLOPT_RETURNTRANSFER => true,\n`;
    code += `${space}CURLOPT_ENCODING => '',\n`;
    code += `${space}CURLOPT_MAXREDIRS => 10,\n`;
    code += `${space}CURLOPT_TIMEOUT => 0,\n`;
    code += `${space}CURLOPT_FOLLOWLOCATION => true,\n`;
    code += `${space}CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,\n`;
    code += `${space}CURLOPT_CUSTOMREQUEST => '${req.method}',\n`;

    if (req.bodyType === 'form-data') {
        code += `${space}CURLOPT_POSTFIELDS => array(\n`;
        req.formData.forEach(fd => {
            if (fd.isFile) {
                code += `${space}${space}'${fd.key}'=> new CURLFILE('${fd.fileName || '/path/to/file'}'),\n`;
            } else {
                code += `${space}${space}'${fd.key}' => '${fd.value.replace(/'/g, "\\'")}',\n`;
            }
        });
        if (req.formData.length > 0) {
            code = code.slice(0, -2) + '\n';
        }
        code += `${space}),\n`;
    } else if (req.bodyType !== 'none') {
        code += `${space}CURLOPT_POSTFIELDS => '${req.body.replace(/\n/g, '\\n').replace(/'/g, "\\'")}',\n`;
    }

    code += `${space}CURLOPT_HTTPHEADER => array(\n`;
    Object.entries(headers).forEach(([k, v]) => {
        if (req.bodyType === 'form-data' && k.toLowerCase() === 'content-type') {
            return;
        }
        code += `${space}${space}'${k}: ${v.replace(/'/g, "\\'")}',\n`;
    });
    if (Object.keys(headers).length > 0) {
        code = code.slice(0, -2) + '\n';
    }
    code += `${space}),\n`;
    code = code.slice(0, -2) + '\n';
    code += `));\n\n`;
    
    code += `$response = curl_exec($curl);\n\n`;
    code += `curl_close($curl);\n`;
    code += `echo $response;\n`;

    return code;
}

function generateRuby(req: ParsedRequest, headers: Record<string, string>, space: string): string {
    let code = `require "uri"\nrequire "net/http"\n\n`;
    code += `url = URI("${req.url}")\n\n`;
    code += `https = Net::HTTP.new(url.host, url.port)\n`;
    code += `https.use_ssl = true if url.scheme == 'https'\n\n`;
    
    const requestClass = `Net::HTTP::${req.method.charAt(0).toUpperCase() + req.method.slice(1).toLowerCase()}`;
    code += `request = ${requestClass}.new(url)\n`;

    Object.entries(headers).forEach(([k, v]) => {
        code += `request["${k}"] = "${v.replace(/"/g, '\\"')}"\n`;
    });

    if (req.bodyType === 'form-data') {
        code += `request.set_form([\n`;
        req.formData.forEach(fd => {
            if (fd.isFile) {
                code += `${space}["${fd.key}", File.open("${fd.fileName || '/path/to/file'}")],\n`;
            } else {
                code += `${space}["${fd.key}", "${fd.value.replace(/"/g, '\\"')}"],\n`;
            }
        });
        if (req.formData.length > 0) {
            code = code.slice(0, -2) + '\n';
        }
        code += `], 'multipart/form-data')\n`;
    } else if (req.bodyType !== 'none') {
        code += `request.body = "${req.body.replace(/\n/g, '\\n').replace(/"/g, '\\"')}"\n`;
    }

    code += `\nresponse = https.request(request)\n`;
    code += `puts response.read_body\n`;

    return code;
}

function generateCSharp(req: ParsedRequest, headers: Record<string, string>, space: string): string {
    let code = `using System;\nusing System.Net.Http;\nusing System.Threading.Tasks;\n\n`;
    code += `class Program\n{\n`;
    code += `${space}static async Task Main(string[] args)\n`;
    code += `${space}{\n`;
    code += `${space}${space}var client = new HttpClient();\n`;
    code += `${space}${space}var request = new HttpRequestMessage(HttpMethod.${req.method.charAt(0).toUpperCase() + req.method.slice(1).toLowerCase()}, "${req.url}");\n`;

    Object.entries(headers).forEach(([k, v]) => {
        if (k.toLowerCase() === 'content-type') return;
        code += `${space}${space}request.Headers.TryAddWithoutValidation("${k}", "${v.replace(/"/g, '\\"')}");\n`;
    });

    if (req.bodyType === 'form-data') {
        code += `${space}${space}var content = new MultipartFormDataContent();\n`;
        req.formData.forEach(fd => {
            if (fd.isFile) {
                code += `${space}${space}content.Add(new StreamContent(System.IO.File.OpenRead("${fd.fileName || '/path/to/file'}")), "${fd.key}", "${fd.fileName ? fd.fileName.split('/').pop() : 'file'}");\n`;
            } else {
                code += `${space}${space}content.Add(new StringContent("${fd.value.replace(/"/g, '\\"')}"), "${fd.key}");\n`;
            }
        });
        code += `${space}${space}request.Content = content;\n`;
    } else if (req.bodyType === 'json') {
        const bodyEscaped = req.body.replace(/"/g, '\\"').replace(/\n/g, '\\n');
        code += `${space}${space}var content = new StringContent("${bodyEscaped}", null, "application/json");\n`;
        code += `${space}${space}request.Content = content;\n`;
    } else if (req.bodyType === 'url-encoded') {
        const bodyEscaped = req.body.replace(/"/g, '\\"').replace(/\n/g, '\\n');
        code += `${space}${space}var content = new StringContent("${bodyEscaped}", null, "application/x-www-form-urlencoded");\n`;
        code += `${space}${space}request.Content = content;\n`;
    } else if (req.bodyType === 'raw') {
        const bodyEscaped = req.body.replace(/"/g, '\\"').replace(/\n/g, '\\n');
        code += `${space}${space}var content = new StringContent("${bodyEscaped}", null, "text/plain");\n`;
        code += `${space}${space}request.Content = content;\n`;
    }

    code += `\n${space}${space}var response = await client.SendAsync(request);\n`;
    code += `${space}${space}response.EnsureSuccessStatusCode();\n`;
    code += `${space}${space}Console.WriteLine(await response.Content.ReadAsStringAsync());\n`;
    code += `${space}}\n}`;

    return code;
}
