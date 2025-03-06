public class PermissionDependencyMock implements HttpCalloutMock {
    // Constants
    private static final String STATUS_CODE_OK = '200';
    private static final String ENCODING = 'UTF-8';
    private static final String QUERY_PARAM = '?q=';
    private static final String CONTENT_TYPE = 'application/json';
    
    private static final String NULL_RESPONSE_TEMPLATE = 
        '{"size": 0, "totalSize": 0, "done": true, "queryLocator": null, ' +
        '"entityTypeName": "PermissionDependency", "records": []}';
    
    private final Map<String, String> queryToResponseMap;
    
    public PermissionDependencyMock() {
        this.queryToResponseMap = new Map<String, String>();
        setupDefaultMockResponses();
    }
    
    public void addCustomResponse(String query, String response) {
        if (String.isBlank(query)) {
            throw new IllegalArgumentException('Query cannot be blank');
        }
        queryToResponseMap.put(normalizeQuery(query), response);
    }
    
    public HTTPResponse respond(HTTPRequest req) {
        validateRequest(req);
        
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', CONTENT_TYPE);
        res.setStatusCode(Integer.valueOf(STATUS_CODE_OK));
        
        try {
            String query = normalizeQuery(extractQueryParam(req.getEndpoint()));
            String responseBody = queryToResponseMap.containsKey(query) ? 
                queryToResponseMap.get(query) : NULL_RESPONSE_TEMPLATE;
            res.setBody(responseBody);
        } catch (Exception e) {
            handleError(res, e);
        }
        
        return res;
    }
    
    private void validateRequest(HTTPRequest req) {
        if (req == null) {
            throw new IllegalArgumentException('Request cannot be null');
        }
        if (String.isBlank(req.getEndpoint())) {
            throw new IllegalArgumentException('Endpoint cannot be blank');
        }
    }
    
    private void handleError(HttpResponse res, Exception e) {
        res.setStatusCode(500);
        res.setBody(JSON.serialize(new Map<String, String>{
            'error' => e.getMessage()
        }));
    }
    
    private String normalizeQuery(String query) {
        if (String.isBlank(query)) return '';
        return query.replaceAll('\\s+', ' ').toLowerCase().trim();
    }
    
    private String extractQueryParam(String endpoint) {
        Integer queryIndex = endpoint.indexOf(QUERY_PARAM);
        if (queryIndex != -1) {
            String encodedQuery = endpoint.substring(queryIndex + QUERY_PARAM.length());
            return EncodingUtil.urlDecode(encodedQuery, ENCODING);
        }
        return '';
    }
    
    private void setupDefaultMockResponses() {
        String accountQuery = 'SELECT Id, Permission, RequiredPermission FROM PermissionDependency WHERE PermissionType = \'Object Permission\' AND RequiredPermissionType = \'Object Permission\' AND (Permission LIKE \'%Account%\' OR RequiredPermission LIKE \'%Account%\')';
            
        String accountResponse = '{"size": 3, "totalSize": 3, "done": true, "queryLocator": null, ' +
            '"entityTypeName": "PermissionDependency", "records": [' +
            '{"attributes": {"type": "PermissionDependency", "url": "/services/data/v58.0/tooling/sobjects/PermissionDependency/001"}, ' +
            '"Id": "001", "Permission": "Account<read>", "RequiredPermission": "Contact<read>"},' +
            '{"attributes": {"type": "PermissionDependency", "url": "/services/data/v58.0/tooling/sobjects/PermissionDependency/002"}, ' +
            '"Id": "002", "Permission": "Account<edit>", "RequiredPermission": "Contact<edit>"},' +
            '{"attributes": {"type": "PermissionDependency", "url": "/services/data/v58.0/tooling/sobjects/PermissionDependency/002"}, ' +
            '"Id": "003", "Permission": "Plan_History__C<read>", "RequiredPermission": "Account<read>"}' +
            ']}';
        
        String contactParentQuery = 'SELECT Id, Permission, RequiredPermission FROM PermissionDependency WHERE PermissionType = \'Object Permission\' AND RequiredPermissionType = \'Object Permission\' AND Permission IN (\'Contact<read>\')';
            
        String contactResponse = NULL_RESPONSE_TEMPLATE;
        String planHistoryQuery = 'SELECT Id, Permission, RequiredPermission FROM PermissionDependency WHERE PermissionType = \'Object Permission\' AND RequiredPermissionType = \'Object Permission\' AND RequiredPermission IN (\'Plan_History__c<read>\')';
        String planHistoryResponse = NULL_RESPONSE_TEMPLATE;

            
        queryToResponseMap.put(normalizeQuery(accountQuery), accountResponse);
        queryToResponseMap.put(normalizeQuery(contactParentQuery), contactResponse);
        queryToResponseMap.put(normalizeQuery(planHistoryQuery), planHistoryResponse);
    }
}