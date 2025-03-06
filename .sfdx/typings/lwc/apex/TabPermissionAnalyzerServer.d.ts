declare module "@salesforce/apex/TabPermissionAnalyzerServer.getProfileOrPermSetTabVisibility" {
  export default function getProfileOrPermSetTabVisibility(param: {profileOrPermissionSetName: any, typeProfileOrPermissionSet: any}): Promise<any>;
}
declare module "@salesforce/apex/TabPermissionAnalyzerServer.tabVisibilityRetrieverForProfile" {
  export default function tabVisibilityRetrieverForProfile(param: {profileNames: any}): Promise<any>;
}
declare module "@salesforce/apex/TabPermissionAnalyzerServer.tabVisibilityRetrieverForPermissionSet" {
  export default function tabVisibilityRetrieverForPermissionSet(param: {permissionSetNames: any}): Promise<any>;
}
declare module "@salesforce/apex/TabPermissionAnalyzerServer.updatePermissionSetTabVisibilities" {
  export default function updatePermissionSetTabVisibilities(param: {tabSettingsJson: any, persetname: any}): Promise<any>;
}
declare module "@salesforce/apex/TabPermissionAnalyzerServer.helperUpdateClassForPermissionset" {
  export default function helperUpdateClassForPermissionset(param: {tabSettingsResult: any, persetname: any}): Promise<any>;
}
declare module "@salesforce/apex/TabPermissionAnalyzerServer.updateProfileTabVisibilities" {
  export default function updateProfileTabVisibilities(param: {profileNames: any, tabToUpdate: any}): Promise<any>;
}
