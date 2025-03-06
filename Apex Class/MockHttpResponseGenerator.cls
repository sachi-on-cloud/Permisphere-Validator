public class MockHttpResponseGenerator implements HttpCalloutMock {
    // Constants
    private static final String CONTENT_TYPE = 'application/json';
    private static final String ERROR_BAD_REQUEST = 'Bad Request';
    private static final Integer HTTP_OK = 200;
    private static final Integer HTTP_BAD_REQUEST = 400;
    
    // Response type enum
    public enum MockType {
        PROFILE_NAME,
        CHECK_DEPENDENCY,
        EMPTY_RESPONSE,
        LOGIN,
        ERROR
    }
    
    private final Integer statusCode;
    private final MockType mockType;
    
    public MockHttpResponseGenerator(Integer statusCode, String mockTypeStr) {
        this.statusCode = statusCode;
        this.mockType = MockType.valueOf(mockTypeStr.toUpperCase());
    }
    
    public HTTPResponse respond(HTTPRequest req) {
        validateRequest(req);
        
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', CONTENT_TYPE);
        res.setStatusCode(statusCode);
        
        try {
            if (statusCode == HTTP_OK) {
                res.setBody(getResponseBody());
            } else if (statusCode == HTTP_BAD_REQUEST) {
                res.setBody(createErrorResponse());
            } else {
                throw new CalloutException('Forced error for testing');
            }
        } catch(Exception e) {
            handleError(res, e);
        }
        
        return res;
    }
    
    private void validateRequest(HTTPRequest req) {
        if(req == null) {
            throw new IllegalArgumentException('Request cannot be null');
        }
    }
    
    private String createErrorResponse() {
        return JSON.serialize(new Map<String, String>{
            'error' => ERROR_BAD_REQUEST
        });
    }
    
    private void handleError(HttpResponse res, Exception e) {
        res.setStatusCode(500);
        res.setBody(JSON.serialize(new Map<String, String>{
            'error' => e.getMessage()
        }));
    }
    
    private String getResponseBody() {
        switch on mockType {
            when 'ProfileName' {
                return JSON.serialize(new Map<String, Object>{
                    'totalSize' => 1,
                    'done' => true,
                    'records' => new List<Map<String, Object>>{
                        new Map<String, Object>{
                            'attributes' => new Map<String, Object>{'type' => 'Profile'},
                            'Id' => '00e36000000lw1MAAQ',
                            'Name' => 'Standard User',
                            'FullName' => 'Standard User'
                        }
                    }
                });
            }
            when 'CheckDependency' {
                return '{"records": [{"Id": "001xx000003DGbTAAW", "Permission": "Account<read>", "RequiredPermission": "Contact<read>"}]}';
            }
            when 'EmptyResponse' {
                return JSON.serialize(new Map<String, Object>{
                    'totalSize' => 0,
                    'done' => true,
                    'records' => new List<Object>()
                });
            }
            when 'Login' {
                return JSON.serialize(new Map<String, Object>{
                    'access_token' => 'REMOVE_SESSION',
                    'instance_url' => System.Url.getOrgDomainUrl().toExternalForm()
                });
            }
            when else {
                return '';
            }
        }
    }
}