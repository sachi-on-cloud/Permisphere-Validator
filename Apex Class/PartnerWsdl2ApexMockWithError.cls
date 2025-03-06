public class PartnerWsdl2ApexMockWithError implements WebServiceMock {
    // Constants
    private static final String DEFAULT_ERROR = 'Login failed: Invalid credentials';
    private final String errorMessage;
    
    public PartnerWsdl2ApexMockWithError() {
        this(DEFAULT_ERROR);
    }
    
    public PartnerWsdl2ApexMockWithError(String errorMessage) {
        this.errorMessage = errorMessage;
    }
    
    public void doInvoke(
        Object stub, Object request, Map<String, Object> response,
        String endpoint, String soapAction, String requestName,
        String responseNS, String responseName, String responseType
    ) {
        validateInput(request);
        throw new CalloutException(errorMessage);
    }
    
    private void validateInput(Object request) {
        if(request == null) {
            throw new IllegalArgumentException('Request cannot be null');
        }
    }
}