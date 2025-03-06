//This class is used to check the functionality of UserAccessBatch class.
@IsTest
private class UserAccessBatchTest {
    private static final String TEST_EMAIL = 'testuser@example.com';
    
    @TestSetup
    static void setupTestData() {
        // Create test users
        List<User> testUsers = createTestUsers(5);
        insert testUsers;
        
        // Create test credentials
        User_Access_Credentials__c credential = new User_Access_Credentials__c(
            Name = 'Test Credential',
            Client_Id__c = 'testClientId',
            Client_Secret__c = 'testClientSecret'
        );
        insert credential;
    }
    
    @IsTest
    static void testBatchExecution_Success() {
        // Arrange
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200, 'Success'));
        
        // Act
        Test.startTest();
        UserAccessBatch batch = new UserAccessBatch();
        Database.executeBatch(batch, 200);
        Test.stopTest();
        
        // Assert
        List<AsyncApexJob> jobs = [
            SELECT Id, Status, NumberOfErrors 
            FROM AsyncApexJob 
            WHERE ApexClass.Name = 'UserAccessBatch'
        ];
        System.assertEquals(1, jobs.size(), 'Should have one batch job');
        System.assertEquals('Completed', jobs[0].Status, 'Batch should complete successfully');
        System.assertEquals(0, jobs[0].NumberOfErrors, 'Should have no errors');
    }
    
    @IsTest
    static void testBatchExecution_Error() {
        // Arrange
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(400, 'Error'));
        
        // Act
        Test.startTest();
        UserAccessBatch batch = new UserAccessBatch();
        Database.executeBatch(batch, 200);
        Test.stopTest();
        
        // Assert
        // Verify error handling
    }
    
    private static List<User> createTestUsers(Integer count) {
        List<User> users = new List<User>();
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User'];
        
        for(Integer i = 0; i < count; i++) {
            users.add(new User(
                Username = 'test.user.' + i + '@test.com',
                Email = 'test.user.' + i + '@test.com',
                FirstName = 'Test',
                LastName = 'User ' + i,
                Alias = 'tuser' + i,
                ProfileId = p.Id,
                EmailEncodingKey = 'UTF-8',
                LanguageLocaleKey = 'en_US',
                LocaleSidKey = 'en_US',
                TimeZoneSidKey = 'America/Los_Angeles'
            ));
        }
        return users;
    }
}