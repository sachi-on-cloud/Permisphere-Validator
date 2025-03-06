//This test class is used to check functionality of TabPermissionAnalyzerServer class.
@IsTest
private class TabPermissionAnalyzerServerTest {
    // Constants
    private static final String TAB_VISIBILITY_NOT_NULL = 'Tab visibility map should not be null';
    private static final String TAB_VISIBILITY_NOT_EMPTY = 'Tab visibility list should not be empty';
    private static final String EXPECTED_EXCEPTION = 'Expected exception was not thrown';
    private static final String Script_Thrown_Message = 'Script-thrown exception';
    private static final String Error_Thrown_Message = 'Expected AuraHandledException but it was not thrown.';
    //This method holds the test data
    @TestSetup
    static void setupTestData() {
        // Create test credentials
        User_Access_Credentials__c credentials = new User_Access_Credentials__c(
            Client_Id__c = 'testClientId',
            Client_Secret__c = 'testClientSecret'
        );
        insert credentials;
        
        // Create test profiles and permission sets
        setupTestProfiles();
        setupTestPermissionSets();
    }
    //This test method is used to check the logics for getProfileOrPermSetTabVisibility method for Permission Set in TabPermissionAnalyzerServer class.
    @IsTest
    static void testGetProfileTabVisibility_Bulk() {
        // Arrange
        List<String> profileNames = new List<String>{'ProfileA', 'ProfileB', 'ProfileC'};
        
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200, 'Login'));
        Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        
        // Act
        Test.startTest();
        List<Map<String, Object>> results = 
            TabPermissionAnalyzerServer.getProfileOrPermSetTabVisibility(
                profileNames, 
                'Profile'
            );
        Test.stopTest();
        
        // Assert
        System.assertNotEquals(null, results, TAB_VISIBILITY_NOT_NULL);
        System.assert(!results.isEmpty(), TAB_VISIBILITY_NOT_EMPTY);
        validateTabVisibilityResults(results);
    }
    //This test method is used to check the logics for getProfileOrPermSetTabVisibility method for Permission Set in TabPermissionAnalyzerServer class.
    @IsTest
    static void testGetProfileOrPermSetTabVisibilityForPermissionSet() {
        Test.startTest();
        List<String> profileNames = new List<String> { 'PermissionSetA' };
        String typeProfile = 'PermissionSet';
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'Login'));
        Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        List < Map < String, Object >> tabVisibility  = TabPermissionAnalyzerServer.getProfileOrPermSetTabVisibility(profileNames, typeProfile);
        Test.stopTest();
        System.assertNotEquals(null, tabVisibility, TAB_VISIBILITY_NOT_NULL);
        System.assert(!tabVisibility.isEmpty(), TAB_VISIBILITY_NOT_EMPTY);
    }
    
    //This test method is used to check the logics for tabVisibilityRetrieverForProfile method in TabPermissionAnalyzerServer class.
    @IsTest
    static void tabVisibilityRetrieverForProfile_Test()
    {
        List<String> profileNames = new List<String> { 'HCH Sales User' };
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'Login'));
        System.Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        MetadataService metaDataService = new MetadataService();
        Test.startTest();
        Map < String, String > tabVisibility = TabPermissionAnalyzerServer.tabVisibilityRetrieverForProfile(profileNames);
        Test.stopTest();
        System.assertNotEquals(null, tabVisibility, TAB_VISIBILITY_NOT_NULL);
        System.assert(!tabVisibility.isEmpty(), TAB_VISIBILITY_NOT_EMPTY);
    }
    
    //This test method is used to check the logics for tabVisibilityRetrieverForPermissionSet(Success) method in TabPermissionAnalyzerServer class.
    @IsTest
    static void tabVisibilityRetrieverForPermissionSet_Test()
    {
        List<String> perSetNames = new List<String> { 'New Test Permission Set 1' };
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'Login'));
        System.Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        MetadataService metaDataService = new MetadataService();
        Test.startTest();
        Map < String, String > tabVisibility = TabPermissionAnalyzerServer.tabVisibilityRetrieverForPermissionSet(perSetNames);
        Test.stopTest();
        System.assertNotEquals(null, tabVisibility, TAB_VISIBILITY_NOT_NULL);
        System.assert(!tabVisibility.isEmpty(), TAB_VISIBILITY_NOT_EMPTY);
    }
    //This test method is used to check the logics for tabVisibilityRetrieverForPermissionSet(Failure) method in TabPermissionAnalyzerServer class.
    @IsTest
    static void tabVisibilityRetrieverForPermissionSet_Test_exceptionHandling()
    {
        List<String> perSetNames = new List<String> { 'New Test Permission Set 1' };
        Test.startTest();
        try{
        Map < String, String > tabVisibility = TabPermissionAnalyzerServer.tabVisibilityRetrieverForPermissionSet(perSetNames);
        System.assert(true, Error_Thrown_Message);
        } catch(Exception e){
          System.assert(e.getMessage().contains(Script_Thrown_Message), Script_Thrown_Message);  
        }
        Test.stopTest();
    }
    
    //This test method is used to check the logics for updateProfileTabVisibilities(success) method in TabPermissionAnalyzerServer class.
     @IsTest
    static void updateProfileTabVisibilities_Test()
    {
        List<String> profileNames = new List<String> { 'HCH Sales User' };
        List<Map<String, Object>> tabToUpdate = new List<Map<String, Object>>();
        Map<String, Object> tab1 = new Map<String, Object>{'Label' => 'Account','Name' => 'standard-Account','Visibility' => 'DefaultOn'};
        tabToUpdate.add(tab1);
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'Login'));
        System.Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        MetadataService metaDataService = new MetadataService();
        Test.startTest();
        TabPermissionAnalyzerServer.updateProfileTabVisibilities(profileNames, tabToUpdate);
        Test.stopTest();
    }
    //This test method is used to check the logics for updateProfileTabVisibilities(Failure) method in TabPermissionAnalyzerServer class.
     @IsTest
    static void updateProfileTabVisibilities_Test_exceptionHandling()
    {
        List<String> profileNames = new List<String> { 'HCH Sales User' };
        List<Map<String, Object>> tabToUpdate = new List<Map<String, Object>>();
        Map<String, Object> tab1 = new Map<String, Object>{'Label' => 'Account','Name' => 'standard-Account','Visibility' => 'DefaultOn'};
        tabToUpdate.add(tab1);
        Test.startTest();
        try{
        TabPermissionAnalyzerServer.updateProfileTabVisibilities(profileNames, tabToUpdate);
        System.assert(true, Error_Thrown_Message);
        } catch(Exception e){
        System.assert(e.getMessage().contains(Script_Thrown_Message), Script_Thrown_Message); 
        }
        Test.stopTest();
    }
    
    //This test method is used to check the logics for updatePermissionSetTabVisibilities(Success) method in TabPermissionAnalyzerServer class.
    @IsTest
    static void updatePermissionSetTabVisibilities_Test() {
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'Login'));
        System.Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        MetadataService metaDataService = new MetadataService();
        Test.startTest();
        List<TabPermissionAnalyzerServer.TabSettingsWrapper> result = TabPermissionAnalyzerServer.updatePermissionSetTabVisibilities( '[{"standard-Account":"visible"}]', 'New Test Permission Set 1');
        handlingErrorsAndExceptionsTest();
        Test.stopTest();
        System.assertNotEquals(null, result, 'The result should not be null.');
        System.assertEquals(1, result.size(), 'The result should contain exactly 1 TabSettingsWrapper entry.');
    }
    //This test method is used to check the logics for updatePermissionSetTabVisibilities(Failure) method in TabPermissionAnalyzerServer class.
    @IsTest
    static void updatePermissionSetTabVisibilities_Test_elseCondition() {
        String invalidPermissionSetName = 'InvalidPermissionSet';
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'Login'));
        System.Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        MetadataService metaDataService = new MetadataService();
        Test.startTest();
        List<TabPermissionAnalyzerServer.TabSettingsWrapper> result = TabPermissionAnalyzerServer.updatePermissionSetTabVisibilities( '[{"standard-Account":"visible"}]', 'InvalidPermissionSet');
        handlingErrorsAndExceptionsTest();
        Test.stopTest();
        System.assertNotEquals(null, result, 'The result should not be null.');
        System.assertEquals(1, result.size(), 'The result should contain exactly 1 TabSettingsWrapper entry.');
    }
    static void handlingErrorsAndExceptionsTest(){
        List<MetadataService.Error> errorList = new List<MetadataService.Error>();
        MetadataService.Error error = new MetadataService.Error();
        error.message = 'Error Occured';
        error.statusCode = '400';
        error.fields = new List<String>();
        error.fields.add('Name');
        errorList.add(error);
        try{
            TabPermissionAnalyzerServer.handleErrorMessages(errorList);
        }
        catch (Exception e) {
            System.assertEquals(e.getMessage(), 'Script-thrown exception', 'Exception Occured as expected');
        }
    }
    private static void validateTabVisibilityResults(List<Map<String, Object>> results) {
        for (Map<String, Object> result : results) {
            System.assert(result.containsKey('Label'), 'Missing Label field');
            System.assert(result.containsKey('Name'), 'Missing Name field');
            System.assert(result.containsKey('Visibility'), 'Missing Visibility field');
        }
    }
}