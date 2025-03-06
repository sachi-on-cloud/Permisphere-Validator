//This class is used to check the functionality of PermissionAnalyzerObjectServer class
@IsTest
public class PermissionAnalyzerObjectServerTest { 
    private static final String OPPORTUNITY_Amount_FIELD = 'Opportunity.Amount';
    private static final String Result_Not_Null_Message = 'Result should not be null';
    //This method holds the test data
    @testsetup
    public static void testsetupMethod() {
       
        Profile testProfile = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        List<User> userList = new List<User>();
        List<PermissionSet> permSets = new List<PermissionSet>();
        List<MutingPermissionSet> mutingPermSets = new List<MutingPermissionSet>();
        List<PermissionSetGroup> permSetGroups = new List<PermissionSetGroup>();
        for(Integer i = 1; i <= 3; i++){
            if(i <= 2){
                userList.add(new User(FirstName = 'Test'+i,LastName = 'User'+i,Email = 'testuser' + i + '@example.com',Username = 'testuseraccess' + i + '@example.com',Alias = 'TU1',
                                      TimeZoneSidKey = 'America/Los_Angeles',LocaleSidKey = 'en_US',EmailEncodingKey = 'UTF-8',ProfileId = testProfile.Id,
                                      LanguageLocaleKey = 'en_US',IsActive = true));
                mutingPermSets.add(new MutingPermissionSet(MasterLabel = 'New Test Mute Permission Set '+i, DeveloperName = 'New_Test_MutePermSet_'+i));
                permSetGroups.add(new PermissionSetGroup(MasterLabel = 'New Test Permission Set Group '+i, DeveloperName = 'New_Test_PermSetGrp_'+i));
            }            
            permSets.add(new permissionSet(Label = 'New Test Permission Set '+i, Name = 'New_Test_Permission_Set_'+i,PermissionsApiEnabled = true));
          }
        insert userList;     
        insert permSets;
        insert mutingPermSets;
        insert permSetGroups;
        
        insertPermissions(permSets, mutingPermSets, permSetGroups);
        
        List<PermissionSetAssignment> permSetAssignments = new List<PermissionSetAssignment>();
        for(Integer i = 1; i <= 2; i++){
            String permSetId;
            if(i == 1){
                permSetId = permSets[0].Id;
            }else{
                permSetId = permSets[1].Id;
            }
            permSetAssignments.add(new PermissionSetAssignment(PermissionSetId = permSetId, AssigneeId = userList[0].Id));
        }
        insert permSetAssignments;  
        System.enqueueJob(new SetupObjectJob());
    }
    
    // Creating Object, Field and group Permissions;
    static void insertPermissions(List<PermissionSet> permSets, List<MutingPermissionSet> mutingPermSets, List<PermissionSetGroup> permSetGroups){
        List<ObjectPermissions> objPermissions = new List<ObjectPermissions>();
        List<FieldPermissions> fieldPermissions = new List<FieldPermissions>();
        List<PermissionSetGroupComponent> permSetGroupComponents = new List<PermissionSetGroupComponent>();
        
        for(Integer i = 1; i <= 4; i++)
        {
            String permSetId;
            Boolean permissionRead;
            String permSetGroupId;
            
            if (Math.mod(i, 2) == 1) { 
                permSetGroupId = permSetGroups[0].Id;
            }else{
                permSetGroupId = permSetGroups[1].Id;
            }
            
            if(i == 1){
                permSetId = permSets[1].Id;
                permissionRead = true;
            }else if(i == 2){
                permSetId = permSets[2].Id;
                permissionRead = true;
            }else if(i == 3){
                permSetId = mutingPermSets[0].Id;
                permissionRead = false;
            }else{
                permSetId = mutingPermSets[1].Id;
                permissionRead = false;
            }
            objPermissions.add(new ObjectPermissions(SObjectType = 'Opportunity', ParentId = permSetId,
                                                     PermissionsRead = permissionRead, PermissionsCreate = true, PermissionsEdit = false,
                                                     PermissionsDelete = false, PermissionsViewAllRecords = false, PermissionsModifyAllRecords = false));
            fieldPermissions.add(new FieldPermissions(SObjectType = 'Opportunity', Field = OPPORTUNITY_Amount_FIELD, ParentId = permSetId,
                                                      PermissionsRead = true, PermissionsEdit = false));
            permSetGroupComponents.add(new PermissionSetGroupComponent(PermissionSetId = permSetId, PermissionSetGroupId = permSetGroupId));
        }
        insert objPermissions;
        insert fieldPermissions; 
        insert permSetGroupComponents;
    }    
     @IsTest
    //This test Method is used to Test getObjectRelatedDetails method.
    static void getObjectRelatedDetails_Test(){
        Test.setMock(WebServiceMock.class, new permissionPartnerSoapSforceComMock());
        permissionPartnerSoapSforceComMock.indicatorVar = 'LoginResult';
        Test.setMock(HttpCalloutMock.class, new PermissionDependencyMock());
        User u = [SELECT Id FROM User WHERE Username = 'testuseraccess1@example.com' LIMIT 1];
        System.runAs(u) {
            Test.startTest();
       	 	PermissionAnalyzerObjectServer.GetObjectWrapper objWrapperResult = PermissionAnalyzerObjectServer.getObjectRelatedDetails('Account');
            List<Object> result = PermissionAnalyzerObjectServer.checkObjectPermissionDependencies('Account');
            Test.stopTest();
            System.assertNotEquals(null, objWrapperResult, 'Object result should not be null');
            System.assertNotEquals(null, result, Result_Not_Null_Message);
            System.assert(result.size() > 0, 'Should return dependencies');
        }        
    }    
   //This test method is used to check the functionality of checkSobjectFoundInPicklist method in PermissionAnalyzerObjectServer class
    @IsTest
    static void checkSobjectFoundInPicklist_Test() {
        Test.startTest();
        System.assert(PermissionAnalyzerObjectServer.checkSobjectFoundInPicklist('Account'), 'Account should be a valid SObject type');
        System.assert(!PermissionAnalyzerObjectServer.checkSobjectFoundInPicklist('TestObj'), 'TestObj should not be a valid SObject type');
        Test.stopTest();
    }    
    //This test method is used to check the functionality of checkFieldFoundInPicklist method in PermissionAnalyzerObjectServer class
    @IsTest
    static void checkFieldFoundInPicklist_Test() {
        Test.startTest();
        Map<String, Boolean> result = PermissionAnalyzerObjectServer.checkFieldFoundInPicklist('Account');
        Test.stopTest();
        System.assertNotEquals(null, result, 'The fieldMap should not be null');
        System.assert(!result.isEmpty(), 'The fieldMap should have at least one value');
    }
    //This test method is used to cover getFieldsRelatedDetails Method
    @IsTest
    static void getFieldsRelatedDetails_Test(){
        Test.StartTest();
        PermissionAnalyzerObjectServer.GetFieldWrapper fieldWrapperResult = PermissionAnalyzerObjectServer.getFieldsRelatedDetails('Account');
        Test.StopTest();
        System.assertNotEquals(null, fieldWrapperResult, 'field result should not be null');
        System.assertNotEquals(null, fieldWrapperResult.hasFieldAccess, 'field hasFieldAccess result should not be null');
    }
    //This test method is used to cover getObjPermissionsForMutingPermSet Method
    @IsTest
    static void getObjPermissionsForMutingPermSet_Test(){
        PermissionSetGroup newGroup = new PermissionSetGroup(MasterLabel = 'New Test Group', DeveloperName = 'New_Test_Group');
        insert newGroup;
        Id groupId = [SELECT Id FROM PermissionSetGroup WHERE DeveloperName = 'New_Test_PermSetGrp_1' LIMIT 1].Id;
        Test.StartTest();
        Map<String,Object> mutePermSet = PermissionAnalyzerObjectServer.getObjPermissionsForMutingPermSet(groupId, new List<String>{'Opportunity'}, 'Opportunity'); 
        PermissionAnalyzerObjectServer.getObjPermissionsForMutingPermSet(newGroup.Id, new List<String>{'Account','Contact'}, 'Account');
        PermissionAnalyzerObjectServer.getObjPermissionsForMutingPermSet(null, new List<String>{'Opportunity'}, 'Opportunity');
        Test.StopTest();
        System.assertNotEquals(null, mutePermSet, 'The result should not be null');
    }
    //This test method is used to cover getFieldPermissionsForMutingPermSet method
    @IsTest
    static void getFieldPermissionsForMutingPermSet_Test(){
        PermissionSetGroup newGroup = new PermissionSetGroup(MasterLabel = 'New Test Group', DeveloperName = 'New_Test_Group');
        insert newGroup;
        Id groupId = [SELECT Id FROM PermissionSetGroup WHERE DeveloperName = 'New_Test_PermSetGrp_1' LIMIT 1].Id;
        Test.StartTest();
        Map<String,Object> mutePermSet = PermissionAnalyzerObjectServer.getFieldPermissionsForMutingPermSet(groupId, 'Opportunity'); 
        PermissionAnalyzerObjectServer.getFieldPermissionsForMutingPermSet(newGroup.Id, 'Account');
        PermissionAnalyzerObjectServer.getFieldPermissionsForMutingPermSet(null, 'Opportunity');
        Test.StopTest();
        System.assertNotEquals(null, mutePermSet, 'The result should not be null');
    }
    //This Method is used to cover getSelectePermissionsetObjResult.
    @IsTest
    static void getSelectePermissionsetObjResult_Test(){
        Test.StartTest();
        Map<String,Object> result = PermissionAnalyzerObjectServer.getSelectePermissionsetObjResult([SELECT Id FROM PermissionSet WHERE Name = 'New_Test_Permission_Set_1'].Id, new List<String>{'Opportunity'});
        Test.StopTest();
        System.assertNotEquals(null, result, Result_Not_Null_Message);
    }
    //This Method is used to cover getSelectePermissionSetFieldResult.
    @IsTest
    static void getSelectePermissionSetFieldResult_Test(){
        PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper eligibleFieldWrapper = new PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper();
        eligibleFieldWrapper.field = OPPORTUNITY_Amount_FIELD;
        eligibleFieldWrapper.PermissionsRead = true;
        eligibleFieldWrapper.PermissionsEdit = true;
        eligibleFieldWrapper.Label = 'Amount';
        eligibleFieldWrapper.hasEditAccess = true;
        eligibleFieldWrapper.mutedPermissionsRead = false;
        eligibleFieldWrapper.mutedPermissionsEdit = false;
        
        Test.StartTest();
        List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper> result = PermissionAnalyzerObjectServer.getSelectePermissionSetFieldResult([SELECT Id FROM PermissionSet WHERE Name = 'New_Test_Permission_Set_1'].Id, new List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper>{eligibleFieldWrapper}, new List<String>{OPPORTUNITY_Amount_FIELD});
        Test.StopTest();
        System.assertNotEquals(null, result, Result_Not_Null_Message);
    }
    //This test method is used to check the functionality of updateObjPermissions method in PermissionAnalyzerObjectServer class
    @IsTest
    static void updateObjPermissions_Test() {
        Map<String, Map<String, Boolean>> objPermissionMap = new Map<String, Map<String, Boolean>>{
            'Case' => new Map<String, Boolean>{
                'PermissionsCreate' => true,
                    'PermissionsRead' => true,
                    'PermissionsEdit' => true,
                    'PermissionsDelete' => true,
                    'PermissionsModifyAllRecords' => true,
                    'PermissionsViewAllRecords' => true
                    }
        };
        Id permissionSetId = [SELECT Id FROM PermissionSet WHERE Name = 'New_Test_Permission_Set_1' LIMIT 1].Id;
        Test.startTest();
        Map<String, Object> result = PermissionAnalyzerObjectServer.updateObjPermissions(objPermissionMap, permissionSetId);
        Test.stopTest();
        System.assertNotEquals(null, result, Result_Not_Null_Message);
    }
    //This test method is used to check the functionality of updateFieldPermissions method in PermissionAnalyzerObjectServer class
    @IsTest
    static void updateFieldPermissions_Test() {
        PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper eligibleFieldWrapper = new PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper();
        eligibleFieldWrapper.field = OPPORTUNITY_Amount_FIELD;
        eligibleFieldWrapper.PermissionsRead = true;
        eligibleFieldWrapper.PermissionsEdit = true;
        eligibleFieldWrapper.Label = 'Amount';
        eligibleFieldWrapper.hasEditAccess = true;
        eligibleFieldWrapper.mutedPermissionsRead = true;
        eligibleFieldWrapper.mutedPermissionsEdit = true;
        PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper eligibleFieldWrapper1 = new PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper();
        eligibleFieldWrapper1.field = 'Opportunity.LeadSource';
        eligibleFieldWrapper1.PermissionsRead = true;
        eligibleFieldWrapper1.PermissionsEdit = true;
        eligibleFieldWrapper1.Label = 'LeadSource';
        eligibleFieldWrapper1.hasEditAccess = true;
        eligibleFieldWrapper1.mutedPermissionsRead = false;
        eligibleFieldWrapper1.mutedPermissionsEdit = false;        
        Id permSetId = [SELECT Id FROM PermissionSet WHERE Name = 'New_Test_Permission_Set_1' LIMIT 1].Id;
        Id mutingPermSetId = [SELECT Id FROM MutingPermissionSet WHERE DeveloperName = 'New_Test_MutePermSet_1' LIMIT 1].Id;
        Test.startTest();
        PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper[] result1 = PermissionAnalyzerObjectServer.updateFieldPermissions(new List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper>{eligibleFieldWrapper,eligibleFieldWrapper1}, permSetId, 'Opportunity', '');
        PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper[] result2 = PermissionAnalyzerObjectServer.updateFieldPermissions(new List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper>{eligibleFieldWrapper,eligibleFieldWrapper1}, mutingPermSetId, 'Opportunity', 'MutePermissions');
        PermissionAnalyzerObjectServer.updateFieldPermissions(new List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper>{eligibleFieldWrapper,eligibleFieldWrapper1}, null, 'Opportunity', '');
        Boolean isExceptionThrown = false;
        try {
            PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper eligibleFieldWrapperErr = new PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper();
            eligibleFieldWrapperErr.field = 'Dummy Fields';
            eligibleFieldWrapperErr.PermissionsRead = true;
            eligibleFieldWrapperErr.PermissionsEdit = true;
            eligibleFieldWrapperErr.Label = 'LeadSource';
            eligibleFieldWrapperErr.hasEditAccess = true;
            eligibleFieldWrapperErr.mutedPermissionsRead = false;
            eligibleFieldWrapperErr.mutedPermissionsEdit = false;
            PermissionAnalyzerObjectServer.updateFieldPermissions(
                new List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper>{eligibleFieldWrapperErr}, 
                permSetId, 'dummy obj', ''
            );
        } catch (Exception e) {
            isExceptionThrown = true;
            System.assert(e.getMessage().contains('Script-thrown exception'), 'Expected invalid object error message, got: ' + e.getMessage());
        }
        Test.stopTest();
        System.assertEquals(new List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper>{eligibleFieldWrapper,eligibleFieldWrapper1}.size(), result1.size(), 'Expected same size of updated wrappers');
        System.assertEquals(new List<PermissionAnalyzerObjectServer.FieldPermissionUpdateWrapper>{eligibleFieldWrapper,eligibleFieldWrapper1}.size(), result2.size(), 'Expected same size of updated wrappers for muting permission set');
        System.assert(isExceptionThrown, 'Exception should be thrown for invalid object');
    }
    //This Method is used to insert the custom setting
    public class SetupObjectJob implements Queueable {
        public void execute(QueueableContext context) {
            User_Access_Credentials__c credentials = new User_Access_Credentials__c(
                Name='Standard', 
                Client_Id__c='testClientId', 
                Client_Secret__c='testClientSecret'
            );
            insert credentials;
        }
    }
    
    // Test constants
    private static final String TEST_OBJECT = 'Account';
    private static final String TEST_FIELD = 'Name';
    private static final String ERROR_MESSAGE = 'Expected error was not thrown';
    
    @TestSetup
    static void setupTestData() {
        // Create test permission sets
        PermissionSet testPermSet = new PermissionSet(
            Label = 'Test Permission Set',
            Name = 'Test_Perm_Set'
        );
        insert testPermSet;
        
        // Create test object permissions
        ObjectPermissions objPerm = new ObjectPermissions(
            ParentId = testPermSet.Id,
            SObjectType = TEST_OBJECT,
            PermissionsRead = true
        );
        insert objPerm;
    }
    
    @IsTest
    static void testGetObjectRelatedDetails_Success() {
        // Arrange
        Test.setMock(WebServiceMock.class, new MetadataWebServiceMock(
            MetadataWebServiceMock.ResponseType.PERMISSION_SET));
            
        // Act
        Test.startTest();
        PermissionAnalyzerObjectServer.GetObjectWrapper result = 
            PermissionAnalyzerObjectServer.getObjectRelatedDetails(TEST_OBJECT);
        Test.stopTest();
        
        // Assert
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assertEquals(true, result.hasObjAccess, 'Should have object access');
    }
    
    @IsTest
    static void testUpdateFieldPermissions_Bulk() {
        // Test bulk operations
        List<FieldPermissionUpdateWrapper> wrappers = new List<FieldPermissionUpdateWrapper>();
        for(Integer i = 0; i < 200; i++) {
            wrappers.add(createTestWrapper());
        }
        
        Test.startTest();
        List<FieldPermissionUpdateWrapper> result = 
            PermissionAnalyzerObjectServer.updateFieldPermissions(
                wrappers,
                [SELECT Id FROM PermissionSet LIMIT 1].Id,
                TEST_OBJECT,
                'Standard'
            );
        Test.stopTest();
        
        System.assertEquals(200, result.size(), 'Should process all records');
    }
    
    // Helper methods
    private static FieldPermissionUpdateWrapper createTestWrapper() {
        FieldPermissionUpdateWrapper wrapper = new FieldPermissionUpdateWrapper();
        wrapper.Field = TEST_FIELD;
        wrapper.PermissionsRead = true;
        wrapper.PermissionsEdit = false;
        return wrapper;
    }
}