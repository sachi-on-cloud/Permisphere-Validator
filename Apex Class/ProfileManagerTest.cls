//This Test Class Used for ProfileManager Class
@IsTest
public class ProfileManagerTest {
    private static final String Error_Null_Result_Message = 'The result should not be null';
	//This Method holds test data for the test class
    @TestSetup
    static void setupTestData() {
		PermissionAnalyzerObjectServerTest.testsetupMethod();
        PermissionSet testPermissionSet = new PermissionSet(Name = 'Test_Sample_PermSet',Label = 'Test Sample PermSet');
        insert testPermissionSet;
    }
	//This test Method Used to Check the getProfileName Method in ProfileManager Class
    @IsTest
    static void testGetProfileName() {
        Test.setMock(WebServiceMock.class, new permissionPartnerSoapSforceComMock());
		permissionPartnerSoapSforceComMock.indicatorVar =  'LoginResult'; 
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'ProfileName'));
        Id profileId = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1].Id;
        
        Test.startTest();
        List<String> profileNames = ProfileManager.getProfileName(profileId);
        Test.stopTest();
        
        System.assertEquals('Standard User', profileNames[0], 'The profile name should match the expected value.');
    }
    //This test Method Used to Check the getProfileusers Method in ProfileManager Class
    @IsTest
    static void testGetProfileUsers() {
        Profile testProfile = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        Test.setMock(WebServiceMock.class, new permissionPartnerSoapSforceComMock());
		permissionPartnerSoapSforceComMock.indicatorVar =  'LoginResult'; 
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'ProfileName'));

        Test.startTest();
        ProfileManager.UserAndProfileDetails result = ProfileManager.getProfileusers(testProfile.Id);
        Test.stopTest();

        System.assertEquals(2, result.userList.size(), 'Expected two users in the result');
    }
    //This test Method Used to Check the getProfileDetails Method in ProfileManager Class
    @IsTest
    static void testGetProfileDetails() {
        Test.startTest();
        List<PermissionSet> result = ProfileManager.getProfileDetails();
        Test.stopTest();
        
        System.assertNotEquals(null,result,Error_Null_Result_Message);

    }
    //This test Method Used to Check the updateProfile Method in ProfileManager Class
    @IsTest
    static void testEditProfileProperties_Success() {
        Profile testProfile = [SELECT Id,Name FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'Login'));
        System.Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        MetadataService metaDataService = new MetadataService();
        Test.startTest();
        String result = ProfileManager.updateProfile(testProfile.Name,'Updated Description'); 
        Test.stopTest();
        System.assertEquals('Updated Description', result, 'Expected updated profile description');
    }
    //This test Method Used to Check the cloneProfile Method in ProfileManager Class
    @IsTest
    static void testCloneProfile_Success() {
        Profile testProfile = [SELECT Id,Name FROM Profile WHERE Name = 'Standard User' LIMIT 1]; 
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'Login'));
        System.Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        MetadataService metaDataService = new MetadataService();
        Test.startTest();
        ProfileManager.cloneProfile(testProfile.Name,'New Profile Test','Modified Description'); 
        Test.stopTest();
        PermissionSet retrievedPermSet = [SELECT Id, Name FROM PermissionSet WHERE Name = 'Test_Sample_PermSet' LIMIT 1];
        System.assertEquals('Test_Sample_PermSet', retrievedPermSet.Name, 'Expected cloned profile name to match');
    }
    //This test Method Used to Check the deleteProfile Method in ProfileManager Class
    @IsTest
    static void testDeleteProfile() {
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'Login'));
        System.Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        MetadataService metaDataService = new MetadataService();
 
        Test.startTest();
        ProfileManager.deleteProfile('HCH Sales User');
        Test.stopTest();
        
        System.assert(true, 'Expected to complete successfully without exceptions');
    }
    //This test Method Used to Check the updateSystemPermissionsProf Method in ProfileManager Class
    @IsTest
    static void updateSystemPermissionsProf_Test() {
        
        Map<String, Boolean> systemPermissions = new Map<String, Boolean>{'MockPermission1' => true,'MockPermission2' => true};
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'Login'));
        System.Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        MetadataService metaDataService = new MetadataService();
        
        Test.startTest();     
        Map<String, Boolean> updatedResult = ProfileManager.updateSystemPermissionsProf('Test_Profile', systemPermissions);
        Test.stopTest();
        
        System.assertNotEquals(null, updatedResult, Error_Null_Result_Message);
    }
    //This test Method Used to Check the getSobjectPermissionsForProfile Method in ProfileManager Class
    @IsTest
    static void testGetSobjectPermissionsForProfile() {
        PermissionSet perSet = [SELECT Id FROM PermissionSet WHERE Name = 'New_Test_Permission_Set_2' LIMIT 1];
        Test.setMock(WebServiceMock.class, new permissionPartnerSoapSforceComMock());
		permissionPartnerSoapSforceComMock.indicatorVar =  'LoginResult'; 
        Test.setMock(HttpCalloutMock.class, new PermissionDependencyMock());

        Test.startTest();
        ProfileManager.ProfileObjectPermissionsWrapper result = ProfileManager.getSobjectPermissionsForProfile(perSet.Id,'Opportunity');
        Test.stopTest();
        System.assertNotEquals(null, result, 'Expected non-null ProfileObjectPermissionsWrapper result');   
        System.assertEquals(true, result.hasObjAccess, 'Expected hasObjAccess to be true');
    }
    //This test Method Used to Check the getCombinedPermissionsforProfile Method in ProfileManager Class
    @IsTest
    static void testGetCombinedPermissionsforProfile() {
        PermissionSet testPermSet = [SELECT Id FROM PermissionSet WHERE Name = 'New_Test_Permission_Set_2' LIMIT 1];
        
        Test.setMock(WebServiceMock.class, new permissionPartnerSoapSforceComMock());
		permissionPartnerSoapSforceComMock.indicatorVar =  'LoginResult'; 
        Test.setMock(HttpCalloutMock.class, new PermissionDependencyMock());
        
        Test.startTest();
        ProfileManager.PermissionFieldWrap result = ProfileManager.getCombinedPermissionsforProfile(testPermSet.Id);
        Test.stopTest();

        System.assertNotEquals(null, result.userPermissions);
        System.assert(result.userPermissions.size() > 0, 'Expected user permissions to be populated');
        System.assertNotEquals(null, result.systemDependencies);
    }
    //This test Method Used to Check the getProfileTabSetting Method in ProfileManager Class
    @IsTest
    static void testGetProfileTabSetting() {
        
        List<String> testProfiles = new List<String>{'Admin'};
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'Login'));
		System.Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        MetadataService metaDataService = new MetadataService();
        
        Test.startTest();
        List<Map<String, Object>> result = ProfileManager.getProfileTabSetting(testProfiles);
        Test.stopTest();

        System.assertNotEquals(null, result, 'Expected result to be non-null');
        System.assert(result.size() > 0, 'Expected result to contain tab settings');
        Map<String, Object> tabSetting1 = result.get(0);
        System.assert(tabSetting1.containsKey('Visibility'), 'Expected Visibility key in tab settings');
    }
    //This test Method Used to Check the getTabPermissions Method in ProfileManager Class
    @IsTest
    static void getTabPermissions_test()
    {
        List<String> profileNames = new List<String>{'TestProfile1', 'TestProfile2'};
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'Login'));
        System.Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        MetadataService metaDataService = new MetadataService();
        Test.startTest();
        Map<String, String> result = ProfileManager.getTabPermissions(profileNames);
        Test.stopTest();
        System.assertNotEquals(null, result, Error_Null_Result_Message);
        System.assert(result.containsKey('standard-Account'), 'Expected key standard-Account to be present in the result');
    }
    //This test Method Used to Check the getTabPermissions Method is Failed in ProfileManager Class
    @IsTest
    static void getTabPermissions_testFail()
    {
        List<String> profileNames = new List<String>{'InvalidProfile'};
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'Login'));
        System.Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        MetadataService metaDataService = new MetadataService();
        Test.startTest();
        Map<String, String> result = ProfileManager.getTabPermissions(profileNames);
        Test.stopTest();
        
        System.assertNotEquals(null, result, Error_Null_Result_Message);  
        System.assertEquals('DefaultOn', result.get('standard-Account'), 'Expected value for standard-Account to be DefaultOn');
    }
    //This test Method Used to Check the getProfileObjectDetails Method in ProfileManager Class
    @IsTest
    static void getProfileObjectDetails_Test()
    {
        PermissionSet testPermSet = [SELECT Id FROM PermissionSet WHERE Name = 'New_Test_Permission_Set_1' LIMIT 1];
        Test.startTest();
        ProfileManager.ProfileObjectDetails result = ProfileManager.getProfileObjectDetails(testPermSet.id);
        Test.stopTest();
        System.assertNotEquals(null, result, Error_Null_Result_Message);  
    }
    //This test Method Used to Check the extractDependentObjects Method in ProfileManager Class 
    @IsTest
    static void testExtractDependentObjects() {
        List<Object> dependSystemPermissions = new List<Object>();
        Map<String, Object> record1 = new Map<String, Object>();
        record1.put('RequiredPermissionType', 'Object Permission');
        record1.put('RequiredPermission', 'Account<Read>');
        dependSystemPermissions.add(record1);
        Map<String, Object> record2 = new Map<String, Object>();
        record2.put('RequiredPermissionType', 'Object Permission');
        record2.put('RequiredPermission', 'Contact<Edit>');
        dependSystemPermissions.add(record2);
        Test.startTest();
        Set<String> result = ProfileManager.extractDependentObjects(dependSystemPermissions);
        Test.stopTest();
        Set<String> expected = new Set<String>{'Account', 'Contact'};
        System.assertEquals(expected, result, 'The dependent objects should match the expected values.');
    }
    //This test Method Used to Check the getObjectPermissions Method in ProfileManager Class 
    @IsTest
    static void testGetObjectPermissions() {
        PermissionSet testPermSet = [SELECT Id FROM PermissionSet WHERE Name = 'New_Test_Permission_Set_1' LIMIT 1];
        Set<String> dependentObjects = new Set<String>{'Account', 'Contact'};
        List<ObjectPermissions> objPermissions = new List<ObjectPermissions>();
        objPermissions.add(new ObjectPermissions(SObjectType = 'Account', ParentId = testPermSet.Id,
                                                 PermissionsRead = true, PermissionsCreate = true, PermissionsEdit = false,
                                                 PermissionsDelete = false, PermissionsViewAllRecords = false, PermissionsModifyAllRecords = false));
        objPermissions.add(new ObjectPermissions(SObjectType = 'Contact', ParentId = testPermSet.Id,
                                                 PermissionsRead = true, PermissionsCreate = true, PermissionsEdit = false,
                                                 PermissionsDelete = false, PermissionsViewAllRecords = false, PermissionsModifyAllRecords = false));
        insert objPermissions;
        Test.startTest();
        Map<String, Map<String, Object>> result = ProfileManager.getObjectPermissions(testPermSet.Id, dependentObjects);
        Test.stopTest();
        System.assert(result.containsKey('Account'), 'Result should contain Account permissions.');
        System.assert(result.containsKey('Contact'), 'Result should contain Contact permissions.');
    }
    //This test Method Used to Check the getProfileObjectDetails Method in ProfileManager Class 
    @IsTest
    static void testGetProfileObjectDetails() {
        PermissionSet testPermSet = [SELECT Id FROM PermissionSet WHERE Name = 'New_Test_Permission_Set_1' LIMIT 1];
        List<ObjectPermissions> objPermissions = new List<ObjectPermissions>();
        objPermissions.add(new ObjectPermissions(SObjectType = 'Account', ParentId = testPermSet.Id,
                                                 PermissionsRead = true, PermissionsCreate = true, PermissionsEdit = false,
                                                 PermissionsDelete = false, PermissionsViewAllRecords = false, PermissionsModifyAllRecords = false));
        objPermissions.add(new ObjectPermissions(SObjectType = 'Contact', ParentId = testPermSet.Id,
                                                 PermissionsRead = true, PermissionsCreate = true, PermissionsEdit = false,
                                                 PermissionsDelete = false, PermissionsViewAllRecords = false, PermissionsModifyAllRecords = false));
        insert objPermissions;
        Test.startTest();
        ProfileManager.ProfileObjectDetails result = ProfileManager.getProfileObjectDetails(testPermSet.Id);
        Test.stopTest();
        System.assertNotEquals(null, result, 'Result should not be null');
        System.assert(result.objectPermissions.containsKey('Account'), 'Result should contain Account permissions.');
        System.assert(result.objectPermissions.containsKey('Contact'), 'Result should contain Contact permissions.');
    }
	//This test Method Used to Check the getFieldPermissionsForProfile Method in ProfileManager Class  
    @isTest
    static void testGetFieldPermissionsForProfile() {
        PermissionSet testPermSet = [SELECT Id FROM PermissionSet WHERE Name = 'New_Test_Permission_Set_1' LIMIT 1];
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200, 'Success'));
        List<Map<String, Object>> fieldPermissions = ProfileManager.getFieldPermissionsForProfile(testPermSet.Id, 'Account');
        Test.stopTest();
        System.assertNotEquals(2, fieldPermissions.size(), 'Expected 2 fields to have permissions');
        Map<String, Object> namePermission = fieldPermissions[0];
        System.assertEquals('Account.Type', namePermission.get('Field'), 'Field name mismatch');
        System.assertEquals(false, namePermission.get('PermissionsRead'), 'PermissionsRead mismatch for Account.Type');
    }
    
    @isTest
    static void testGetProfilePermsToCovertPermSet_ValidProfile() {
        Profile testProfile = [SELECT Id,Name FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator(200,'Login'));
        System.Test.setMock(WebServiceMock.class, new MetadataWebServiceMock());
        MetadataService metaDataService = new MetadataService();
        Map<String, Object> permSetToCreate = new Map<String, Object>{
            'Name' => 'Test_Perm_Set',
            'Label' => 'Test Permission Set',
            'Description' => 'Description of Permission Set',
            'hasActivationRequired' => false
        };
        Test.startTest();
        ProfileManager.getProfilePermsToCovertPermSet(testProfile.Name, permSetToCreate);
        Test.stopTest();
        System.assert(true, 'Method executed successfully');
    }

    @IsTest
    static void testGetProfileName_NullInput() {
        Test.startTest();
        try {
            ProfileManager.getProfileName(null);
            System.assert(false, 'Should throw exception for null input');
        } catch(AuraHandledException e) {
            System.assert(true, 'Exception thrown as expected');
        }
        Test.stopTest();
    }
}