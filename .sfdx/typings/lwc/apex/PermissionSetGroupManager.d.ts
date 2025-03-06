declare module "@salesforce/apex/PermissionSetGroupManager.getPermissionSetGrp" {
  export default function getPermissionSetGrp(): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.createPermissionSetGroup" {
  export default function createPermissionSetGroup(param: {label: any, apiName: any, description: any, permissionSetIds: any, isRequired: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.editPermissionSetGrp" {
  export default function editPermissionSetGrp(param: {perSetId: any, label: any, apiName: any, description: any, format: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.clonePermissionSetGroup" {
  export default function clonePermissionSetGroup(param: {sourcePermissionSetGroupName: any, newLabel: any, newApiName: any, newDescription: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.deletePermissionSetGroupWithUnassignments" {
  export default function deletePermissionSetGroupWithUnassignments(param: {permissionSetGroupId: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getUserPermissionSetGroup" {
  export default function getUserPermissionSetGroup(param: {profileName: any, userLicense: any, perSetGrpId_tofetch: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getPermissionGroup" {
  export default function getPermissionGroup(param: {userId: any, perGrp_Id: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getPermissionSetGroup" {
  export default function getPermissionSetGroup(param: {perSetGrp_Id: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.deletePermissionGroup" {
  export default function deletePermissionGroup(param: {userId: any, delPerGrpId: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getProfiles" {
  export default function getProfiles(): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getPermissionSet" {
  export default function getPermissionSet(param: {permissionSetGroupId: any, searchperset: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.insertPermissionSet" {
  export default function insertPermissionSet(param: {permissionSetId: any, permissionSetGroupId: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.deletePermissionSet" {
  export default function deletePermissionSet(param: {permissionSetId: any, delPerSetId: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getAssignedPermissionSet" {
  export default function getAssignedPermissionSet(param: {permissionSetGroupId: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getSetPermission" {
  export default function getSetPermission(): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getProfileDetails" {
  export default function getProfileDetails(): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getUnAssignedUserForPermissionSet" {
  export default function getUnAssignedUserForPermissionSet(param: {permissionSetId: any, profileName: any, userLicense: any, licenseName: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.checkDuplicatePermissionSetGroup" {
  export default function checkDuplicatePermissionSetGroup(param: {label: any, apiName: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getCombinedPermissions" {
  export default function getCombinedPermissions(param: {permissionSetGroupId: any, persetapi: any, persetname: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getObjectPermissionsforPSG" {
  export default function getObjectPermissionsforPSG(param: {parent_persetgrpid: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getmutingObjectPermissionsforPSG" {
  export default function getmutingObjectPermissionsforPSG(param: {muting_persetgrpid: any, psgapiname: any, psgname: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.mutePermissions" {
  export default function mutePermissions(param: {systemPermissionsMapJson: any, psgname: any, psgapiname: any, psgid: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getFieldPermissionspsg" {
  export default function getFieldPermissionspsg(param: {persetgrpid: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getmutingFieldPermissionspsg" {
  export default function getmutingFieldPermissionspsg(param: {persetgrpid_toMute: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.updateMutePermissions" {
  export default function updateMutePermissions(param: {mutePermId: any, permSetId: any, objName: any, objPermission: any, fieldPermissionWrapperList: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.updateObjPermissions" {
  export default function updateObjPermissions(param: {objPerms: any, permSetId: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.updateFieldPermissions" {
  export default function updateFieldPermissions(param: {fieldPermissionWrapperList: any, permissionSetId: any, objName: any, fieldPermType: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getSobject" {
  export default function getSobject(param: {permId: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getSobjectPermissionsForPermissionSetGroup" {
  export default function getSobjectPermissionsForPermissionSetGroup(param: {permSetId: any, objName: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.objAndFieldPermHelper" {
  export default function objAndFieldPermHelper(param: {permSetId: any, objNames: any, objName: any}): Promise<any>;
}
declare module "@salesforce/apex/PermissionSetGroupManager.getMutedObjandFieldPermissions" {
  export default function getMutedObjandFieldPermissions(param: {groupId: any, objNames: any, objName: any}): Promise<any>;
}
