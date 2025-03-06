declare module "@salesforce/apex/ProfileManager.getProfileName" {
  export default function getProfileName(param: {profileId: any}): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.updateProfile" {
  export default function updateProfile(param: {profileName: any, newDescription: any}): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.cloneProfile" {
  export default function cloneProfile(param: {profileName: any, newProfileName: any, newDescription: any}): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.deleteProfile" {
  export default function deleteProfile(param: {profileName: any}): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.getProfileusers" {
  export default function getProfileusers(param: {profId: any}): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.getProfileDetails" {
  export default function getProfileDetails(): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.getProfileTabSetting" {
  export default function getProfileTabSetting(param: {profileName: any}): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.getTabPermissions" {
  export default function getTabPermissions(param: {profileNames: any}): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.getSobjectPermissionsForProfile" {
  export default function getSobjectPermissionsForProfile(param: {permSetId: any, objName: any}): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.getFieldPermissionsForProfile" {
  export default function getFieldPermissionsForProfile(param: {permSetId: any, objName: any}): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.checkFieldType" {
  export default function checkFieldType(param: {sObjName: any}): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.getFieldDefinitionProfile" {
  export default function getFieldDefinitionProfile(param: {objectName: any}): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.checkSObjType" {
  export default function checkSObjType(param: {sObjName: any}): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.getCombinedPermissionsforProfile" {
  export default function getCombinedPermissionsforProfile(param: {permissionSetIds: any}): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.updateSystemPermissionsProf" {
  export default function updateSystemPermissionsProf(param: {profileName: any, systemPermissions: any}): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.getProfileObjectDetails" {
  export default function getProfileObjectDetails(param: {permId: any}): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.checkDuplicateProfile" {
  export default function checkDuplicateProfile(param: {label: any}): Promise<any>;
}
declare module "@salesforce/apex/ProfileManager.getProfilePermsToCovertPermSet" {
  export default function getProfilePermsToCovertPermSet(param: {profileName: any, permSetToCreate: any}): Promise<any>;
}
