import { describe, it, expect } from 'vitest';
import { parseCurl, generateCode } from './parser';

describe('cURL Parser & Code Generator Unit Tests', () => {
    
    // AAA Pattern: Arrange, Act, Assert

    describe('cURL Parser Engine', () => {
        
        it('should correctly parse a simple GET request', () => {
            // Arrange
            const curl = 'curl "https://api.example.com/v1/users?page=1&limit=10"';

            // Act
            const result = parseCurl(curl);

            // Assert
            expect(result.error).toBeUndefined();
            expect(result.method).toBe('GET');
            expect(result.url).toBe('https://api.example.com/v1/users?page=1&limit=10');
            expect(result.queryParams).toEqual([
                { key: 'page', value: '1' },
                { key: 'limit', value: '10' }
            ]);
            expect(result.bodyType).toBe('none');
        });

        it('should clean multi-line continuation escape characters for Linux and Windows', () => {
            // Arrange
            const curl = `curl "https://api.example.com/data" \\
  -H "Accept: application/json" \\
  -d '{"id": 123}'`;

            // Act
            const result = parseCurl(curl);

            // Assert
            expect(result.error).toBeUndefined();
            expect(result.method).toBe('POST');
            expect(result.headers).toContainEqual({ key: 'Accept', value: 'application/json' });
            expect(result.bodyType).toBe('json');
            expect(JSON.parse(result.body)).toEqual({ id: 123 });
        });

        it('should extract cookies and auth parameters', () => {
            // Arrange
            const curl = `curl https://api.example.com/profile -H "Cookie: user=admin; theme=dark" -u "username:secretpassword"`;

            // Act
            const result = parseCurl(curl);

            // Assert
            expect(result.error).toBeUndefined();
            expect(result.cookies).toContainEqual({ key: 'user', value: 'admin' });
            expect(result.cookies).toContainEqual({ key: 'theme', value: 'dark' });
            expect(result.auth.type).toBe('basic');
            expect(result.auth.username).toBe('username');
            expect(result.auth.password).toBe('secretpassword');
            expect(result.headers).toContainEqual({ key: 'Authorization', value: 'Basic dXNlcm5hbWU6c2VjcmV0cGFzc3dvcmQ=' });
        });

        it('should recognize Bearer tokens from authorization header', () => {
            // Arrange
            const curl = `curl https://api.example.com/resource -H "Authorization: Bearer my_jwt_token_xyz"`;

            // Act
            const result = parseCurl(curl);

            // Assert
            expect(result.error).toBeUndefined();
            expect(result.auth.type).toBe('bearer');
            expect(result.auth.token).toBe('my_jwt_token_xyz');
        });

        it('should recognize form fields and files', () => {
            // Arrange
            const curl = `curl https://api.example.com/upload -F "image=@/path/to/my_avatar.png" -F "username=alice"`;

            // Act
            const result = parseCurl(curl);

            // Assert
            expect(result.error).toBeUndefined();
            expect(result.bodyType).toBe('form-data');
            expect(result.formData).toContainEqual({ key: 'image', value: '@/path/to/my_avatar.png', isFile: true, fileName: '/path/to/my_avatar.png' });
            expect(result.formData).toContainEqual({ key: 'username', value: 'alice', isFile: false, fileName: undefined });
        });

        it('should raise diagnostic suggestions for mismatched quotes', () => {
            // Arrange
            const curl = `curl "https://api.example.com/broken-quotes`;

            // Act
            const result = parseCurl(curl);

            // Assert
            expect(result.error).toBeDefined();
            expect(result.errorSuggestions).toBeDefined();
            expect(result.errorSuggestions?.length).toBeGreaterThan(0);
        });
    });

    describe('Code Generator Engine', () => {
        
        it('should generate Fetch API code snippet with correct indentation', () => {
            // Arrange
            const req = parseCurl('curl https://api.example.com/get -H "X-Test: value"');

            // Act
            const code = generateCode(req, 'fetch', 4);

            // Assert
            expect(code).toContain('fetch("https://api.example.com/get"');
            expect(code).toContain('    method: "GET"');
            expect(code).toContain('myHeaders.append("X-Test", "value")');
        });

        it('should generate Python requests code snippet', () => {
            // Arrange
            const req = parseCurl('curl https://api.example.com/post -X POST -d "{\"ok\": true}"');

            // Act
            const code = generateCode(req, 'python', 4);

            // Assert
            expect(code).toContain('import requests');
            expect(code).toContain('response = requests.request(');
            expect(code).toContain('"POST"');
        });

        it('should generate Go code snippet', () => {
            // Arrange
            const req = parseCurl('curl https://api.example.com/get');

            // Act
            const code = generateCode(req, 'go', 2);

            // Assert
            expect(code).toContain('package main');
            expect(code).toContain('http.NewRequest');
        });
    });
});
