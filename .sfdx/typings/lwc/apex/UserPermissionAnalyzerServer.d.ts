declare module "@salesforce/apex/UserPermissionAnalyzerServer.getCombinedUserPermissionsForUser" {
  export default function getCombinedUserPermissionsForUser(param: {permissionSetIds: any}): Promise<any>;
}
declare module "@salesforce/apex/UserPermissionAnalyzerServer.getMutedUserPermissionOfPermSetGrp" {
  export default function getMutedUserPermissionOfPermSetGrp(param: {groupId: any, fieldNames: any, userPermissions: any}): Promise<any>;
}
declare module "@salesforce/apex/UserPermissionAnalyzerServer.getSelectedUserPermissionOrigins" {
  export default function getSelectedUserPermissionOrigins(param: {permissionType: any, permSetIds: any}): Promise<any>;
}
declare module "@salesforce/apex/UserPermissionAnalyzerServer.updateUserPermissionsforProfOrPermSetOrMuteGroups" {
  export default function updateUserPermissionsforProfOrPermSetOrMuteGroups(param: {permSetId: any, profileName: any, systemPermissions: any}): Promise<any>;
}
declare module "@salesforce/apex/UserPermissionAnalyzerServer.profileUserPermissionsUpdate" {
  export default function profileUserPermissionsUpdate(param: {profileNames: any, systemPermissions: any}): Promise<any>;
}
