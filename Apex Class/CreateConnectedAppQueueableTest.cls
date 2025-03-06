//This class is used to check the functionality of CreateConnectedAppQueueable class.
@IsTest
public class CreateConnectedAppQueueableTest {
    // Constants for test data
    private static final String TEST_EMAIL = 'testuser@domain.com';
    private static final String TEST_SESSION_ID = 'mockSessionId';
    private static final String CONNECTED_APP_NAME = 'User Access Connected App';
    
    @TestSetup
    static void setupTestData() {
        // Create test data that can be reused across test methods
        try {
            // Setup test data if needed
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'Test setup failed: ' + e.getMessage());
            throw e;
        }
    }

    @isTest
    static void testCreateConnectedAppQueueable_Success() {
        // Arrange
        CreateConnectedAppQueueable queueable = new CreateConnectedAppQueueable(
            TEST_SESSION_ID, 
            TEST_EMAIL, 
            TEST_EMAIL
        );

        // Act
        Test.startTest();
        
        // Set up mocks
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200, 'Login'));
        Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        
        // Execute queueable
        System.enqueueJob(queueable);
        
        Test.stopTest();

        // Assert
        List<ConnectedApplication> connectedApps = [
            SELECT Id, Name 
            FROM ConnectedApplication 
            WHERE Name = :CONNECTED_APP_NAME
        ];
        
        // Verify connected app creation
        Assert.isTrue(!connectedApps.isEmpty(), 
            'Connected App should be created');
        
        // Verify user details
        Assert.areEqual(TEST_EMAIL, queueable.currentUserUsername, 
            'Username should match test email');
        
        // Verify platform event creation
        List<ConnectedAppEvent__e> events = getPublishedEvents();
        Assert.isTrue(!events.isEmpty(), 
            'Platform event should be published');
    }

    @isTest
    static void testCreateConnectedAppQueueable_Error_NullInputs() {
        // Arrange
        CreateConnectedAppQueueable queueable = new CreateConnectedAppQueueable(
            null, 
            null, 
            null
        );

        // Act
        Test.startTest();
        
        try {
            System.enqueueJob(queueable);
        } catch (Exception e) {
            // Assert exception handling
            Assert.isTrue(e.getMessage().length() > 0, 
                'Should have meaningful error message');
        }
        
        Test.stopTest();

        // Assert error event publication
        List<ConnectedAppEvent__e> errorEvents = getPublishedErrorEvents();
        Assert.isTrue(!errorEvents.isEmpty(), 
            'Error event should be published');
    }

    @isTest
    static void testCreateConnectedAppQueueable_Error_InvalidSessionId() {
        // Arrange
        CreateConnectedAppQueueable queueable = new CreateConnectedAppQueueable(
            'invalidSessionId', 
            TEST_EMAIL, 
            TEST_EMAIL
        );

        // Act
        Test.startTest();
        
        Test.setMock(HttpCalloutMock.class, 
            new MockHttpResponseGenerator(401, 'Invalid Session ID'));
            
        System.enqueueJob(queueable);
        
        Test.stopTest();

        // Assert error handling
        List<ConnectedAppEvent__e> errorEvents = getPublishedErrorEvents();
        Assert.isTrue(!errorEvents.isEmpty(), 
            'Error event should be published for invalid session');
    }

    @isTest
    static void testCreateConnectedAppQueueable_Bulk() {
        // Test bulk processing capabilities
        List<CreateConnectedAppQueueable> queueables = new List<CreateConnectedAppQueueable>();
        
        for(Integer i = 0; i < 5; i++) {
            queueables.add(new CreateConnectedAppQueueable(
                TEST_SESSION_ID + i,
                TEST_EMAIL + i,
                TEST_EMAIL + i
            ));
        }

        Test.startTest();
        
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200, 'Login'));
        Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        
        for(CreateConnectedAppQueueable q : queueables) {
            System.enqueueJob(q);
        }
        
        Test.stopTest();

        // Verify bulk processing
        List<ConnectedApplication> apps = [
            SELECT Id 
            FROM ConnectedApplication 
            WHERE Name LIKE 'User Access Connected App%'
        ];
        
        Assert.isTrue(apps.size() > 0, 
            'Should handle bulk processing');
    }

    // Helper methods
    private static List<ConnectedAppEvent__e> getPublishedEvents() {
        // Query for published events
        return [
            SELECT Status__c, Message__c 
            FROM ConnectedAppEvent__e 
            WHERE Status__c = 'Success'
        ];
    }

    private static List<ConnectedAppEvent__e> getPublishedErrorEvents() {
        // Query for error events
        return [
            SELECT Status__c, Message__c 
            FROM ConnectedAppEvent__e 
            WHERE Status__c = 'Error'
        ];
    }
}