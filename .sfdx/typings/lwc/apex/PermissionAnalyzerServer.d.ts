declare module "@salesforce/apex/PermissionAnalyzerServer.getUser" {
  export default function getUser(param: {searchUserName: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerServer.getUserRelatedPermissionSets" {
  export default function getUserRelatedPermissionSets(param: {userId: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerServer.getEntityDefinition" {
  export default function getEntityDefinition(param: {objType: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerServer.getCombinedObjAndFieldPermsForUser" {
  export default function getCombinedObjAndFieldPermsForUser(param: {permissionSetIds: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerServer.getProfileName" {
  export default function getProfileName(param: {profileId: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerServer.getAssignedUsersForProfilePerSetPerSetGrp" {
  export default function getAssignedUsersForProfilePerSetPerSetGrp(param: {profpersetId: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerServer.editPermSetGrpProperties" {
  export default function editPermSetGrpProperties(param: {perSetId: any, label: any, apiName: any, description: any, format: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerServer.editPermSetProperties" {
  export default function editPermSetProperties(param: {perSetId: any, label: any, apiName: any, description: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerServer.editProfileProperties" {
  export default function editProfileProperties(param: {profileName: any, newDescription: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionAnalyzerServer.getObjDefinition" {
  export default function getObjDefinition(param: {objectName: any}): Promise<any>;
}
