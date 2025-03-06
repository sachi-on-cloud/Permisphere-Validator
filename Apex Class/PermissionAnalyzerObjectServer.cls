//This Class is Used to Handle object and Field Permissions
// Used In PermissionAnalyzerObject _LWC
public with sharing class PermissionAnalyzerObjectServer {
    public static final String PERM_DEP_QUERY_STRING = 'SELECT Id, Permission, RequiredPermission FROM PermissionDependency WHERE PermissionType = \'Object Permission\' AND RequiredPermissionType = \'Object Permission\' ';
    public class GetFieldWrapper {
        @AuraEnabled
        public List<Map<String, Object>> fieldLabelMap { get; set; }             
        @AuraEnabled
        public Map<String, Boolean> hasFieldAccess { get; set; }        
        public GetFieldWrapper(
            List<Map<String, Object>> fieldLabelMap,Map<String, Boolean> hasFieldAccess) {
                this.fieldLabelMap = fieldLabelMap;   
                this.hasFieldAccess = hasFieldAccess;                
            }
    }
    public class GetObjectWrapper {
        @AuraEnabled
        public Boolean hasObjAccess { get; set; } 
        @AuraEnabled
        public List<Object> dependentObj { get; set; }
        public GetObjectWrapper(Boolean hasObjAccess,List<Object> dependentObj){            
             this.hasObjAccess = hasObjAccess; 
             this.dependentObj = dependentObj;
        }
    }
    // Constants
    private static final String ERROR_MISSING_PARAMS = 'Required parameters are missing';
    private static final Integer QUERY_LIMIT = 50000;
    private static final String SOAP_ERROR = 'SOAP request failed: {0}';
    
    // Cache for frequently accessed data
    private static Map<String, Boolean> objectPermissionsCache = new Map<String, Boolean>();
    private static Map<String, Map<String, Boolean>> fieldPermissionsCache = new Map<String, Map<String, Boolean>>();

    //This Method Used to retrieve  valid Sobjects for Obj Permissions, fetch Object Permissons Dependencies
    @AuraEnabled
    public static GetObjectWrapper getObjectRelatedDetails(String sObjectNameList) {
        if(String.isBlank(sObjectNameList)) {
            throw new AuraHandledException(ERROR_MISSING_PARAMS);
        }
        
        try {
            Boolean hasAccess = checkSobjectFoundInPicklist(sObjectNameList);
            List<Object> dependencies = checkObjectPermissionDependencies(sObjectNameList);
            return new GetObjectWrapper(hasAccess, dependencies);
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    //This Method Used to retrieve fieldDefinition, Valid field for field Permissions
    @AuraEnabled
    public static GetFieldWrapper getFieldsRelatedDetails(String sObjectNameList) {
        List<Map<string, Object>> fieldLabelMap = PermissionTabServer.getFieldDefinition(sObjectNameList);
        return new GetFieldWrapper(fieldLabelMap,checkFieldFoundInPicklist(sObjectNameList));
    }
    //Helper to get the valid Sobject for updating ObjectPermissions.
    @AuraEnabled
    public static Boolean checkSobjectFoundInPicklist(string sObjName) {
        for (Schema.PicklistEntry p : objectPermissions.SObjectType.getDescribe().getPicklistValues()) {
            if (sObjName == p.getValue()) {
                return true;
            }
        }
        return false;
    }
    //Helper to get the valid fields for updating ObjectPermissions.
    @AuraEnabled
    public static Map<String, Boolean> checkFieldFoundInPicklist(String sObjName) {
        Map<String, Boolean> fieldMap = new Map<String, Boolean>();
        for (Schema.PicklistEntry p : fieldPermissions.Field.getDescribe().getPicklistValues()) {
            if (sObjName == p.getValue().split('\\.')[0]) {
                fieldMap.put(p.getValue(), true);
            }
        }
        return fieldMap;
    }
    //Helper to get the ObjectPermission Dependencies 
    @AuraEnabled
    public static List<Object> checkObjectPermissionDependencies(String objName) {
        UserAccessManager instance = new UserAccessManager();
        List<Object> allDependencies = new List<Object>();
        fetchDependencies(objName,allDependencies,instance.partnerConnection.SessionHeader.sessionId,System.Url.getOrgDomainUrl().toExternalForm());
        Set<String> sObjectNameSet = new Set<String>();
        for (Object record : allDependencies) {
            Map<String, Object> recordMap = (Map<String, Object>) record;
            addObjectNameToSet(sObjectNameSet, (String) recordMap.get('Permission'));
            addObjectNameToSet(sObjectNameSet, (String) recordMap.get('RequiredPermission'));
        }        
        // Filter allDependencies based on the query result
        Set<String> matchingObjNamesSet = new Set<String>();
        for (FieldDefinition fieldDef : [SELECT EntityDefinition.QualifiedApiName
                                         FROM FieldDefinition WHERE IsPolymorphicForeignKey = TRUE AND EntityDefinition.QualifiedApiName IN: sObjectNameSet
                                         Limit 50000]) {
                                             matchingObjNamesSet.add(fieldDef.EntityDefinition.QualifiedApiName);
                                         }
        // Remove matching records from allDependencies
        List<Object> filteredDependencies = new List<Object>();
        for (Object record : allDependencies) {
            Map<String, Object> recordMap = (Map<String, Object>) record;
            if (!isMatchingObject(matchingObjNamesSet, (String) recordMap.get('Permission')) &&
                !isMatchingObject(matchingObjNamesSet, (String) recordMap.get('RequiredPermission'))) {
                    filteredDependencies.add(record);
                }
        }
        System.debug('Filtered Dependencies: ' + filteredDependencies);
        return filteredDependencies;        
    }
    private static void addObjectNameToSet(Set < String > sObjectNameSet, String permission) {
        if (permission != null) {
            sObjectNameSet.add(permission.split('<')[0]);
        }
    }
    private static boolean isMatchingObject(Set < String > matchingObjNamesSet, String permission) {
        return permission != null && matchingObjNamesSet.contains(permission.split('<')[0]);
    }
    @TestVisible
    private static void fetchDependencies(String objName, List < Object > allDependencies, String sessionId, String serverUrl) {
        if (String.isBlank(objName)) {
            return;
        }
        String query = PERM_DEP_QUERY_STRING + ' AND (Permission LIKE \'%' + String.escapeSingleQuotes(objName) + '%\' ' +
            'OR RequiredPermission LIKE \'%' + String.escapeSingleQuotes(objName) + '%\') ';
        List < Object > queryResults = sendQueryRequest(query, sessionId, serverUrl);
        Set < String > parentObjects = new Set < String > ();
        Set < String > childObjects = new Set < String > ();
        for (Object record: queryResults) {
            Map < String, Object > recordMap = (Map < String, Object > ) record;
            allDependencies.add(record);
            String permission = (String) recordMap.get('Permission');
            String requiredPermission = (String) recordMap.get('RequiredPermission');
            
            if (permission != null && permission.contains(objName)) {
                parentObjects.add('\'' + requiredPermission + '\'');
            }
            if (requiredPermission != null && requiredPermission.contains(objName)) {
                childObjects.add('\'' + permission + '\'');
            }
        }
        if (!parentObjects.isEmpty()) {
            processParentObjects(new List < String > (parentObjects), allDependencies, sessionId, serverUrl);
        }
        if (!childObjects.isEmpty()) {
            processChildObjects(new List < String > (childObjects), allDependencies, sessionId, serverUrl);
        }
    }
    @TestVisible
    private static void processParentObjects(List < String > parentObjects, List < Object > allDependencies, String sessionId, String serverUrl) {
        if (parentObjects.isEmpty()) {
            return;
        }
        String parentObjNames = String.join(parentObjects, ',');
        String query = PERM_DEP_QUERY_STRING + ' AND Permission IN (' + parentObjNames + ') ';
        List < Object > queryResults = sendQueryRequest(query, sessionId, serverUrl);
        Set < String > newParentObjects = new Set < String > ();
        for (Object record: queryResults) {
            Map < String, Object > recordMap = (Map < String, Object > ) record;
            allDependencies.add(record);
            String requiredPermission = (String) recordMap.get('RequiredPermission');
            if (String.isNotBlank(requiredPermission)) {
                newParentObjects.add('\'' + requiredPermission + '\'');
            }
        }
        if (!newParentObjects.isEmpty()) {
            processParentObjects(new List < String > (newParentObjects), allDependencies, sessionId, serverUrl);
        }
    }
    @TestVisible
    private static void processChildObjects(List < String > childObjects, List < Object > allDependencies, String sessionId, String serverUrl) {
        if (childObjects.isEmpty()) {
            return;
        }  
        String childObjNames = String.join(childObjects, ',');
        String query = PERM_DEP_QUERY_STRING + ' AND RequiredPermission IN (' + childObjNames + ') ';
        List < Object > queryResults = sendQueryRequest(query, sessionId, serverUrl);
        Set < String > newChildObjects = new Set < String > ();
        for (Object record: queryResults) {
            Map < String, Object > recordMap = (Map < String, Object > ) record;
            allDependencies.add(record);
            String permission = (String) recordMap.get('Permission');
            if (String.isNotBlank(permission)) {
                newChildObjects.add('\'' + permission + '\'');
            }
        }
        if (!newChildObjects.isEmpty()) {
            processChildObjects(new List < String > (newChildObjects), allDependencies, sessionId, serverUrl);
        }
    }   
    @TestVisible
    private static List < Object > sendQueryRequest(String query, String sessionId, String serverUrl) {
        String endpoint = serverUrl + '/services/data/v58.0/tooling/query?q=' + EncodingUtil.urlEncode(query, 'UTF-8');
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + sessionId);
        req.setHeader('Content-Type', 'application/json');
        try {
            Http http = new Http();
            HttpResponse res = http.send(req);
            if (res.getStatusCode() == 200) {
                Map < String, Object > responseMap = (Map < String, Object > ) JSON.deserializeUntyped(res.getBody());
                return (List < Object > ) responseMap.get('records');
            } else {
                System.debug('Error: ' + res.getStatus() + ' - ' + res.getBody());
            }
        } catch (Exception e) {
            System.debug('Exception occurred: ' + e.getMessage());
        }
        return new List < Object > ();
    }  
    //This Method is Used to fetch Object Permissions for PermissionSetGroup related MutingPermissionSet
    @AuraEnabled
    public static Map<String,Object> getObjPermissionsForMutingPermSet(String groupId, List < String > objNames, String objName){
        Map<String,Object> mutingObjPermissions = new Map<String,Object>();
        Map < String, Object > permissionSetMap = new Map < String, Object > ();
        if (String.isBlank(groupId)) {
            return null;
        }
        String permSetId = getMutingPermissionSetId(groupId);
        if (String.isBlank(permSetId)) {
            return null;
        }
        if (String.isNotBlank(permSetId)) {
            mutingObjPermissions.put('mutePermSetId',permSetId);
            for (ObjectPermissions objPerm: [SELECT SObjectType, PermissionsCreate, PermissionsEdit, PermissionsRead,
                                             PermissionsDelete, PermissionsModifyAllRecords, PermissionsViewAllRecords
                                             FROM ObjectPermissions WHERE ParentId =: permSetId AND SObjectType IN: objNames LIMIT 50000
                                            ])
            {
                permissionSetMap.put(objPerm.SObjectType, new Map < String, Object > {
                                                    'SObjectType' => objPerm.SObjectType,
                                                    'PermissionsRead' => objPerm.PermissionsRead,
                                                    'PermissionsCreate' => objPerm.PermissionsCreate,
                                                    'PermissionsEdit' => objPerm.PermissionsEdit,
                                                    'PermissionsDelete' => objPerm.PermissionsDelete,
                                                    'PermissionsViewAllRecords' => objPerm.PermissionsViewAllRecords,
                                                    'PermissionsModifyAllRecords' => objPerm.PermissionsModifyAllRecords
                                                     });
                mutingObjPermissions.put('objectPermissions',permissionSetMap);
            }
        }
        
        return mutingObjPermissions;
    }
    //This Method is Used to fetch Field Permissions for PermissionSetGroup related MutingPermissionSet
    @AuraEnabled
    public static Map<String,Object> getFieldPermissionsForMutingPermSet(String groupId, String objName){
        Map<String,Object> mutingFieldPermissions = new Map<String,Object>();
        Map<String,Object> fieldPermissionsMap = new Map<String,Object> ();
        if (String.isBlank(groupId)) {
            return null;
        }
        String permSetId = getMutingPermissionSetId(groupId);
        if (String.isBlank(permSetId)) {
            return null;
        }
        if (String.isNotBlank(permSetId)) {
            mutingFieldPermissions.put('mutePermSetId',permSetId);
            for (FieldPermissions fieldPerm: [SELECT Field, PermissionsRead, PermissionsEdit
                                              FROM FieldPermissions
                                              WHERE ParentId =: permSetId AND SObjectType =: objName LIMIT 50000
                                             ]) 
            {
                fieldPermissionsMap.put(fieldPerm.Field, new Map < String, Object > {
                    'PermissionsRead' => fieldPerm.PermissionsRead,
                        'PermissionsEdit' => fieldPerm.PermissionsEdit,
                        'Field' => fieldPerm.Field
                        });
                mutingFieldPermissions.put('fieldPermissions',fieldPermissionsMap);
            }
        }
        return mutingFieldPermissions;
    }
    private static String getMutingPermissionSetId(String groupId) {
        List < PermissionSetGroupComponent > permSetGroupComponents = [ SELECT PermissionSetId FROM PermissionSetGroupComponent
                                                                       WHERE PermissionSetGroupId =: groupId AND (NOT PermissionSet.Name LIKE '%_%') LIMIT 1];
        
        if (!permSetGroupComponents.isEmpty()) {
            return permSetGroupComponents[0].PermissionSetId;
        }
        List<PermissionSetGroup> permSetGrp = [SELECT MasterLabel, DeveloperName FROM PermissionSetGroup WHERE Id =: groupId LIMIT 1];
        String mutePermissionId;
        if (permSetGrp.isEmpty()) {
            return null;
        }else if(permSetGrp.size() == 1){
            Map<String,Boolean> checkAccessLevelForMutingPermissioSet = PermissionAnalyzerServer.getObjDefinition('MutingPermissionSet');
            if(checkAccessLevelForMutingPermissioSet.get('Create')){
                MutingPermissionSet mutePerm = new MutingPermissionSet(
                    MasterLabel = permSetGrp[0].MasterLabel + ' Muted',
                    DeveloperName = permSetGrp[0].DeveloperName + '_Muted'
                );
                insert mutePerm;
                Map<String,Boolean> checkAccessLevelForPermissionSetGroupComponent = PermissionAnalyzerServer.getObjDefinition('PermissionSetGroupComponent');
                if(checkAccessLevelForPermissionSetGroupComponent.get('Create')){
                    mutePermissionId = mutePerm.Id;
                    PermissionSetGroupComponent grpComponent = new PermissionSetGroupComponent(PermissionSetGroupId = groupId,  
                                                                                               PermissionSetId = mutePerm.Id );
                    insert grpComponent;
                }
            }
        }
        return mutePermissionId;
    }  
    public class FieldPermissionUpdateWrapper {
        @AuraEnabled public String Field { get; set; }
        @AuraEnabled public Boolean PermissionsRead { get; set; }
        @AuraEnabled public Boolean PermissionsEdit { get; set; }
        @AuraEnabled public String label { get; set; }
        @AuraEnabled public Boolean hasEditAccess { get; set; }
        @AuraEnabled public Boolean mutedPermissionsRead { get; set; }
        @AuraEnabled public Boolean mutedPermissionsEdit { get; set; }
    }
    //This Method is Used to Fetch the PermissionSet's Object permissions to update the profile Changes to PermissionSet 
    @AuraEnabled
    public static Map < String, Object > getSelectePermissionsetObjResult(String permSetId, List < String > objNames) {
        Map < String, Object > existingObjPermsMap = new Map < String, Object > ();        
        if (String.isNotBlank(permSetId)) {
            for (ObjectPermissions objPerm: [SELECT SObjectType, PermissionsRead, PermissionsDelete, PermissionsEdit, PermissionsCreate, PermissionsViewAllRecords, PermissionsModifyAllRecords
                                             FROM ObjectPermissions
                                             WHERE ParentId =: permSetId AND SobjectType IN: objNames LIMIT 50000
                                            ]) {
                                                existingObjPermsMap.put(objPerm.SobjectType, new Map < String, Boolean > {
                                                    'PermissionsRead' => objPerm.PermissionsRead,
                                                        'PermissionsDelete' => objPerm.PermissionsDelete,
                                                        'PermissionsEdit' => objPerm.PermissionsEdit,
                                                        'PermissionsCreate' => objPerm.PermissionsCreate,
                                                        'PermissionsViewAllRecords' => objPerm.PermissionsViewAllRecords,
                                                        'PermissionsModifyAllRecords' => objPerm.PermissionsModifyAllRecords
                                                        });
                                            }
        }
        return existingObjPermsMap;
    }
    //This Method is Used to Fetch the PermissionSets's Field Permissions to update the Profile changes to permissionset
    @AuraEnabled
    public static List<FieldPermissionUpdateWrapper> getSelectePermissionSetFieldResult(String permSetId, List < FieldPermissionUpdateWrapper > fieldMap, List < String > fieldsList){
        Map <String, FieldPermissionUpdateWrapper> fieldWrapperMap = new Map <String, FieldPermissionUpdateWrapper>();
        if (String.isNotBlank(permSetId)) {
            // Create a map for quick lookup of FieldPermissionUpdateWrapper objects
            for (FieldPermissionUpdateWrapper wrapper: fieldMap) {
                fieldWrapperMap.put(wrapper.Field, wrapper);
            }  
            // Query Field Permissions
            if (!fieldMap.isEmpty()) {
                for (FieldPermissions fieldPerm: [SELECT PermissionsRead, PermissionsEdit, Field
                                                  FROM FieldPermissions
                                                  WHERE ParentId =: permSetId AND Field IN: fieldsList LIMIT 50000
                                                 ]) {
                                                     FieldPermissionUpdateWrapper wrapper = fieldWrapperMap.get(fieldPerm.Field);
                                                     if (wrapper != null) {
                                                         wrapper.PermissionsRead = fieldPerm.PermissionsRead;
                                                         wrapper.PermissionsEdit = fieldPerm.PermissionsEdit;
                                                     }
                                                 }
            }
            
        }
        return fieldMap;
    }
    // This Method is the Handler for Updating Object Permissions
    @AuraEnabled
    public static Map<String, Object> updateObjPermissions(Map<String, Map<String, Object>> objPerms, String permSetId) {
        Map < String, Object > resultMap = new Map < String, Object > ();
        if (String.isBlank(permSetId) || objPerms == null || objPerms.isEmpty()) {
            return resultMap;
        }
        try {
            Set < String > objNames = objPerms.keySet();
            Map < String, ObjectPermissions > existingPermMap = new Map < String, ObjectPermissions > ();
            for (ObjectPermissions perm: [SELECT Id, ParentId, SobjectType, PermissionsCreate, PermissionsRead,
                                          PermissionsEdit, PermissionsDelete, PermissionsModifyAllRecords,
                                          PermissionsViewAllRecords
                                          FROM ObjectPermissions
                                          WHERE ParentId =: permSetId AND SobjectType IN: objNames LIMIT 50000
                                         ]) {
                                             existingPermMap.put(perm.SobjectType, perm);
                                         }            
            List < ObjectPermissions > objPermissionsToUpsert = new List < ObjectPermissions > ();            
            for (String objName: objPerms.keySet()) {
                Map < String, Object > permissionsMap = objPerms.get(objName);
                //This Method is the Handler for Updating Field Permissions
                ObjectPermissions objToUpsert = existingPermMap.containsKey(objName) ?
                 existingPermMap.get(objName) : new ObjectPermissions(ParentId = permSetId, SobjectType = objName);
                objToUpsert.PermissionsCreate = (Boolean) permissionsMap.get('PermissionsCreate');
                objToUpsert.PermissionsRead = (Boolean) permissionsMap.get('PermissionsRead');
                objToUpsert.PermissionsEdit = (Boolean) permissionsMap.get('PermissionsEdit');
                objToUpsert.PermissionsDelete = (Boolean) permissionsMap.get('PermissionsDelete');
                objToUpsert.PermissionsModifyAllRecords = (Boolean) permissionsMap.get('PermissionsModifyAllRecords');
                objToUpsert.PermissionsViewAllRecords = (Boolean) permissionsMap.get('PermissionsViewAllRecords');
                objPermissionsToUpsert.add(objToUpsert);
                resultMap.put(objName, objToUpsert);
            }
            Map<String,Boolean> checkAccessLevelForObjectPermissions = PermissionAnalyzerServer.getObjDefinition('ObjectPermissions');
            if (!objPermissionsToUpsert.isEmpty() && checkAccessLevelForObjectPermissions.get('Create') 
                && checkAccessLevelForObjectPermissions.get('Update')) {
                    upsert objPermissionsToUpsert;
                }
            return resultMap;
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'Error updating object permissions: ' + e.getMessage());
            throw new AuraHandledException('An error occurred while updating object permissions: ' + e.getMessage());
        }
    }
    //This Method is the Handler for Updating Field Permissions
    @AuraEnabled
    public static List<FieldPermissionUpdateWrapper> updateFieldPermissions(
        List<FieldPermissionUpdateWrapper> fieldPermissionWrapperList, 
        String permissionSetId, 
        String objName, 
        String fieldPermType
    ) {
        // Input validation
        if (String.isBlank(permissionSetId) || fieldPermissionWrapperList == null || 
            fieldPermissionWrapperList.isEmpty()) {
            throw new AuraHandledException(ERROR_MISSING_PARAMS);
        }

        try {
            // Bulkify DML operations
            List<FieldPermissions> permissionsToUpsert = new List<FieldPermissions>();
            Map<String, FieldPermissionUpdateWrapper> fieldWrapperMap = new Map<String, FieldPermissionUpdateWrapper>();
            
            // Process in batches to handle governor limits
            for (List<FieldPermissionUpdateWrapper> batch : 
                splitIntoBatches(fieldPermissionWrapperList, 200)) {
                processFieldPermissionsBatch(batch, permissionSetId, objName, fieldPermType);
            }
            
            return fieldPermissionWrapperList;
        } catch(Exception e) {
            throw new AuraHandledException('Error updating field permissions: ' + e.getMessage());
        }
    }  
   //This Helper Method for updateFieldPermissions is used to handle fieldPermissions to update.
    private static List<FieldPermissions> updateFieldPermissionsHelper(Map <String, FieldPermissions> existingPermissionsMap,String objName ,Map <String, FieldPermissionUpdateWrapper> fieldWrapperMap, String permissionSetId, String fieldPermType){
        List<FieldPermissions> fieldPermList = new List<FieldPermissions>();
        for (String fieldName: fieldWrapperMap.keySet()) {
            FieldPermissionUpdateWrapper fieldPermWrap = fieldWrapperMap.get(fieldName);
            FieldPermissions permission = existingPermissionsMap.containsKey(fieldName) ?
                existingPermissionsMap.get(fieldName) :
            new FieldPermissions(SObjectType = objName, Field = fieldName, ParentId = permissionSetId);            
            if (fieldPermType != 'MutePermissions') {
                permission.PermissionsRead = fieldPermWrap.PermissionsRead;
                permission.PermissionsEdit = fieldPermWrap.PermissionsEdit;
            } else {
                permission.PermissionsRead = fieldPermWrap.mutedPermissionsRead;
                permission.PermissionsEdit = fieldPermWrap.mutedPermissionsEdit;
            }            
            fieldPermList.add(permission);
        }
        return fieldPermList;
    }
    // Helper method for batch processing
    private static void processFieldPermissionsBatch(
        List<FieldPermissionUpdateWrapper> batch,
        String permissionSetId,
        String objName,
        String fieldPermType
    ) {
        // Process batch of records
        List<FieldPermissions> permissionsToUpsert = 
            updateFieldPermissionsHelper(batch, permissionSetId, objName, fieldPermType);
        
        if (!permissionsToUpsert.isEmpty()) {
            Database.SaveResult[] results = Database.upsert(permissionsToUpsert, false);
            handleDMLResults(results);
        }
    }
    // Improved error handling
    private static void handleDMLResults(Database.SaveResult[] results) {
        List<String> errors = new List<String>();
        
        for(Database.SaveResult result : results) {
            if(!result.isSuccess()) {
                errors.add(result.getErrors()[0].getMessage());
            }
        }
        
        if(!errors.isEmpty()) {
            throw new AuraHandledException(String.join(errors, '; '));
        }
    }
}