//This class is used to check the functionality of ConnectedAppCreation class.
@isTest
public class ConnectedAppCreationTest {
    // Constants for reusability and maintenance
    private static final String APP_CREATION_MESSAGE = 'Connected App creation is in progress. Please wait... ';
    private static final String APP_EXISTS_MESSAGE = 'Error: App Exist';
    private static final String TEST_PERMISSION_SET_NAME = 'New_Test_Permission_Set_6';
    
    @testSetup
    static void setupTestData() {
        // Create test data with proper error handling
        try {
            PermissionAnalyzerObjectServerTest.testsetupMethod();
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'Test setup failed: ' + e.getMessage());
            throw e;
        }
    }

    // Test positive scenario with null check
    @isTest
    static void testCreateApp_AppDoesNotExist() {
        Test.startTest();
        String result = ConnectedAppCreation.createApp('NonExistentId');
        Test.stopTest();
        
        Assert.areEqual(APP_CREATION_MESSAGE, result, 
            'Should return creation message for non-existent app');
        Assert.isNotNull(result, 'Result should not be null');
    }

    // Test existing app scenario with proper data setup
    @isTest
    static void testCreateApp_AppExists() {
        ConnectedApplication existingApp = createTestConnectedApp();
        
        Test.startTest();
        String result = ConnectedAppCreation.createApp(existingApp.Id);
        Test.stopTest();
        
        Assert.areEqual(APP_EXISTS_MESSAGE, result, 
            'Should return error message for existing app');
    }

    // Test null input handling
    @isTest
    static void testGetUserAccessConnectedApp_NullInput() {
        Test.startTest();
        Boolean result = ConnectedAppCreation.getUserAccessConnectedApp(null);
        Test.stopTest();
        
        Assert.areEqual(false, result, 
            'Should return false for null input');
    }

    // Test bulk operations
    @isTest
    static void testAssignAssignmentsConnectedApp_BulkOperation() {
        ConnectedApplication existingApp = createTestConnectedApp();
        List<PermissionSet> permSets = createBulkPermissionSets(100);
        List<String> permSetIds = new List<String>();
        
        for(PermissionSet ps : permSets) {
            permSetIds.add(ps.Id);
        }
        
        Test.startTest();
        try {
            ConnectedAppCreation.assignAssignmentsConnectedApp(existingApp.Id, permSetIds);
        } catch (Exception e) {
            System.assert(false, 'Bulk operation failed: ' + e.getMessage());
        }
        Test.stopTest();
        
        List<SetupEntityAccess> assignments = [
            SELECT Id 
            FROM SetupEntityAccess 
            WHERE SetupEntityId = :existingApp.Id
        ];
        Assert.isTrue(assignments.size() > 0, 
            'Should successfully process bulk assignments');
    }

    // Test negative scenarios
    @isTest
    static void testAssignAssignmentsConnectedApp_InvalidInput() {
        Test.startTest();
        try {
            ConnectedAppCreation.assignAssignmentsConnectedApp(null, null);
            Assert.fail('Should throw exception for null inputs');
        } catch (Exception e) {
            Assert.isTrue(e.getMessage().length() > 0, 
                'Should have meaningful error message');
        }
        Test.stopTest();
    }

    // Helper methods for test data creation
    private static ConnectedApplication createTestConnectedApp() {
        ConnectedApplication app = new ConnectedApplication(
            Name = 'Test Connected App',
            Description = 'Test Description'
            // Add other required fields
        );
        insert app;
        return app;
    }

    private static List<PermissionSet> createBulkPermissionSets(Integer count) {
        List<PermissionSet> permSets = new List<PermissionSet>();
        
        for(Integer i = 0; i < count; i++) {
            permSets.add(new PermissionSet(
                Name = TEST_PERMISSION_SET_NAME + i,
                Label = 'Test Permission Set ' + i
            ));
        }
        
        insert permSets;
        return permSets;
    }
}