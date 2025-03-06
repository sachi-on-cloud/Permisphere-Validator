//This class is used for User Dependency mock.
public with sharing class UserPermissionDependencyMock implements HttpCalloutMock {
    // Constants
    private static final Integer STATUS_OK = 200;
    private static final String CONTENT_TYPE = 'application/json';
    private static final String API_VERSION = 'v58.0';
    
    // Mock response templates
    private static final String RESPONSE_TEMPLATE = 
        '{"size": {0}, "totalSize": {0}, "done": true, "queryLocator": null, ' + 
        '"entityTypeName": "PermissionDependency", "records": {1}}';
    
    private List<MockPermissionDependency> mockDependencies;
    
    public UserPermissionDependencyMock() {
        this.mockDependencies = getDefaultDependencies();
    }
    
    public HTTPResponse respond(HTTPRequest req) {
        validateRequest(req);
        
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', CONTENT_TYPE);
        res.setStatusCode(STATUS_OK);
        res.setBody(generateResponseBody());
        return res;
    }
    
    private String generateResponseBody() {
        List<String> records = new List<String>();
        for(MockPermissionDependency dep : mockDependencies) {
            records.add(dep.toJson());
        }
        
        return String.format(
            RESPONSE_TEMPLATE, 
            new List<String>{
                String.valueOf(mockDependencies.size()),
                '[' + String.join(records, ',') + ']'
            }
        );
    }
    
    private List<MockPermissionDependency> getDefaultDependencies() {
        return new List<MockPermissionDependency>{
            new MockPermissionDependency('EmailSingle', 'EditTask'),
            new MockPermissionDependency('EmailMass', 'EmailSingle'),
            new MockPermissionDependency('ExportReport', 'RunReports'),
            new MockPermissionDependency('ManageUsers', 'ResetPasswords'),
            new MockPermissionDependency('ManageUsers', 'ViewAllUsers')
        };
    }
    
    private void validateRequest(HTTPRequest req) {
        if(req == null) {
            throw new MockException('Request cannot be null');
        }
    }
    
    // Inner class for mock dependency structure
    private class MockPermissionDependency {
        private String permission;
        private String requiredPermission;
        private String id;
        
        public MockPermissionDependency(String permission, String requiredPermission) {
            this.permission = permission;
            this.requiredPermission = requiredPermission;
            this.id = generateMockId();
        }
        
        public String toJson() {
            return '{"attributes":{"type":"PermissionDependency","url":"/services/data/' + 
                   API_VERSION + '/tooling/sobjects/PermissionDependency/' + id + '"},' +
                   '"Id":"' + id + '",' +
                   '"Permission":"' + permission + '",' +
                   '"RequiredPermission":"' + requiredPermission + '"}';
        }
        
        private String generateMockId() {
            return '2Pd' + String.valueOf(Math.random()).substring(2, 17) + 'CAA';
        }
    }
    
    public class MockException extends Exception {}
}