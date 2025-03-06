//This component is used to view users of profile,delete profile,editing profile property & to update user,object,field,recordtype & tab permissions of profile. 
//This Component is used as child Component under ManagePermissionSetGroupComponent.
import {LightningElement,api,track} from 'lwc';
import getProfileusers from '@salesforce/apex/ProfileManager.getProfileusers';
import updateProfile from '@salesforce/apex/ProfileManager.updateProfile';
import cloneProfile from '@salesforce/apex/ProfileManager.cloneProfile';
import deleteProfile from '@salesforce/apex/ProfileManager.deleteProfile';
import getCombinedPermissionsforProfile from '@salesforce/apex/ProfileManager.getCombinedPermissionsforProfile';
import getProfileObjectDetails from '@salesforce/apex/ProfileManager.getProfileObjectDetails';
import updateSystemPermissionsProf from '@salesforce/apex/ProfileManager.updateSystemPermissionsProf';
import getSobjectPermissionsForProfile from '@salesforce/apex/ProfileManager.getSobjectPermissionsForProfile';
import getProfileTabSetting from '@salesforce/apex/ProfileManager.getProfileTabSetting';
import updateTabSettings from '@salesforce/apex/TabPermissionAnalyzerServer.updateProfileTabVisibilities';
import updateObjPermissions from '@salesforce/apex/PermissionAnalyzerObjectServer.updateObjPermissions';
import checkDuplicateProfile from '@salesforce/apex/ProfileManager.checkDuplicateProfile';
import getProfilePermsToCovertPermSet from '@salesforce/apex/ProfileManager.getProfilePermsToCovertPermSet';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import LightningConfirm from 'lightning/confirm';
export default class ManageProfileComponent extends LightningElement {
    @track profileState = {
        isSelected: false,
        details: {},
        users: [],
        value: {}
    };
    isUsersTable = false;
    showUsers = false;
    showSpinner = false;
    @track userValue = [];
    @track _profileValue = {};
    isEditClicked = false;
    labelValue = '';
    descriptionValue = '';
    @track isStandard = false;
    isSaveDisabled = true;
    @track systemPermissionSet = [];
    @track lastSavedUserPermissions = [];
    @track objPermissions = {};
    objDepPermissions = {};
    lastSavedObjPerm = {};
    @track fieldPermissions = [];
    objectDependencies = [];
    lastSavedFieldPerm = [];
    disabledUserEdit = true;
    disabledObjEdit = true;
    disabledFieldEdit = true;
    hasObjAccess = false;
    @track objList = [];
    @track tabList = [];
    @track lastSavedTab = [];
    changedTablist = [];
    @track affectedSobject = [];
    @track tabValue = "User permissions"
    enableEdit = false;
    enableRecTypeEdit = false;
    hasEditAccess = false;
    @track searchKey = '';
    @track searchUserPermKey = '';
    @track searchTabKey = '';
    @track searchFieldKey = ''
    @track dataSetObject;
    isUserPerm = false
    isField = false
    isTab = false;
    @track hasObject = true;
    @track hasTab = true;
    @track hasField = true;
    @track hasUser = true;
    @track hasObjEditAccess = false;
    @track updatedResult = {};
    changedRecordType = [];
    changedFieldPermissions = [];
    changedObjPermissions = {};
    systemPermissions = [];
    isdeletetConfirmMessage = false;
    isUpdateEnabled = true;
    enableDefaultProfile = true;
    isShowObjectSpinner = false;
    @track sortBy;
    @track sortDirection;
    userLength;
    profNameList = [];
    requiredPermissionSet;
    permissionSet;
    @track psSystemMap = {}
    isCloneProfile = false;
    isClone = false;
    @track createPermissionSetObj = {};
    isCreateDisabled = true;
    userColumn = [{
            label: 'Full Name',
            fieldName: 'Name',
            sortable: true
        },
        {
            label: 'User Name',
            fieldName: 'Username',
            sortable: true
        },
        {
            label: 'Is Active',
            fieldName: 'isActive',
            sortable: true
        },
        {
            label: 'User License',
            fieldName: 'licenseName',
            sortable: true
        },
    ];
    @track tabOption = [{
            label: 'DefaultOn',
            value: 'DefaultOn'
        },
        {
            label: 'DefaultOff',
            value: 'DefaultOff'
        },
        {
            label: 'Hidden',
            value: 'Hidden'
        },
    ]

    @api
    get profileValue() {
        return this._profileValue;
    }
    set profileValue(value) {
        this._profileValue = value;
        this.profNameList = this._profileValue;
        this.showSpinner = true;
        this.hasEditAccess = this._profileValue.isCustom != 'Standard' ? true : false;
        this.handleProfileChange();
    }

    //This method is used to get profile based users list.
    handleProfileChange() {
        Promise.all([
            getProfileusers({profId: this._profileValue.profileId}),
            getCombinedPermissionsforProfile(this._profileValue.permSetId)
        ])
        .then(([userResult, permResult]) => {
            console.log('result', userResult);
            this.userValue = userResult.userList.map(res => {
                return {
                    Name: res.Name,
                    Username: res.Username,
                    isActive: res.IsActive,
                    licenseName: res.Profile?.UserLicense?.Name
                };
            });
            this.userLength = this.userValue.length;
            this.showUsers = this.userValue.length > 0 ? true : false;
            this._profileValue = {
                ...this._profileValue,
                profileName: userResult.profileName,
                label: this.updatedResult[this._profileValue.profileId]?.label ? this.updatedResult[this._profileValue.profileId].label : this._profileValue.label,
                description: this.updatedResult[this._profileValue.profileId]?.description ? this.updatedResult[this._profileValue.profileId].description : this._profileValue.description
            };
            this.tabValue = 'User permissions';
            this.systemPermissions = JSON.parse(JSON.stringify(permResult.systemDependencies));
            this.systemPermissionSet = permResult.userPermissions.map(info => ({
                Label: info.fieldLabel,
                Name: info.fieldName,
                Value: info.fieldValue
            }));
            this.showUserPerTable = this.systemPermissionSet.length > 0;
            this.showSpinner = false;
            this.systemPermissionSet.sort((a, b) =>
                a.Label.toLowerCase().localeCompare(b.Label.toLowerCase())
            );
            this.isUserPerm = this.systemPermissionSet.length > 0 ? true : false;
            this.lastSavedUserPermissions = JSON.parse(JSON.stringify(this.systemPermissionSet));
            this.tabList = permResult.tabList;
            this.objList = permResult.entityDefList.map(entity => {
                return {
                    label: entity.Label,
                    value: entity.QualifiedApiName,
                    isOpen: false,
                    icon: 'utility:chevronright',
                    cursorClass: 'cursor-pointer',
                    hasAccess: this.objDepPermissions && this.objDepPermissions[entity.QualifiedApiName] ? true : false,
                    buttonStyle: this.objDepPermissions && this.objDepPermissions[entity.QualifiedApiName] ? 'background-color : rgb(204 251 241); color : rgb(17 94 89);display: inline-flex;align-items: center;row-gap: 1.5px;padding-left:8px;padding-right:8px;padding-top: 3.5px;padding-bottom: 3.5px;border-radius: 10%;font-size: small;font-weight: bold;border:0px;' : 'background-color : rgb(254 226 226); color: rgb(153 27 27);display: inline-flex;align-items: center;row-gap: 1.5px;padding-left:8px;padding-right:8px;padding-top: 3.5px;padding-bottom: 3.5px;border-radius: 10%;font-size: small;font-weight: bold;border:0px;'
                }
            }).sort((a, b) => {
                if (a.hasAccess === b.hasAccess) {
                    return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
                }
                return a.hasAccess ? -1 : 1;
            });
        })
        .catch((error) => {
            console.error('Error fetching profile details:', JSON.stringify(error));
            this.showSpinner = false;
        });
    }
    //This function will used to sort data by direction.
    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }
    //Helper method for sorting data
    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.userValue));
        let keyValue = (a) => {
            return a[fieldname];
        };
        let isReverse = direction === 'asc' ? 1 : -1;
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : '';
            y = keyValue(y) ? keyValue(y) : '';
            return isReverse * ((x > y) - (y > x));
        });
        this.userValue = parseData;
    }
    //This function is used for calling the user table template in html.
    handleviewUserClick() {
        this.isUsersTable = true;
    }
    //This function is used for editing profile properties based on profile type(standard/custom)
    handleEditPropClick() {
        if (this._profileValue.isCustom == 'Standard') {
            this.isStandard = true;
        } else {
            this.isStandard = false;
        }
        this.descriptionValue = this._profileValue.description;
        console.log('this.descriptionValue : ',this.descriptionValue);
        this.isEditClicked = true;
    }
    handleCloneProfileClick(){
        this.isClone = true;
    }
    handleProfileClone() {
        this.isClone = false;
        this.isCloneProfile = true;
        this.descriptionValue = this._profileValue.description;
        this.labelValue = this._profileValue.label;
    }
    //This getter method function is for searching objects in UI.
    get filteredObjList() {
        if (this.searchKey) {
            return this.objList.filter(obj => obj.label.toLowerCase().includes(this.searchKey.toLowerCase()));
        }
        return this.objList;
    }
    //This getter method function is for searching User permissions in UI.
    get filteredUserPermList() {
        if (this.searchUserPermKey) {
            return this.systemPermissionSet.filter(userPerm => userPerm.Label.toLowerCase().includes(this.searchUserPermKey.toLowerCase()));
        }
        return this.systemPermissionSet;
    }
    //This getter method function is for searching Tab settings in UI.
    get filteredTabList() {
        if (this.searchTabKey) {
            return this.tabList.filter(tab => tab.Label.toLowerCase().includes(this.searchTabKey.toLowerCase()));
        }
        return this.tabList;
    }
    //This getter method function is for searching Fields in UI.
    get filteredFieldList() {
        if (this.searchFieldKey) {
            return this.fieldPermissions.filter(field => field.label.toLowerCase().includes(this.searchFieldKey.toLowerCase()));
        }
        return this.fieldPermissions;
    }
    //This function is used for calling search method based on user/object/field/tab.
    handleSearchKeyChange(event) {
        if (event.target.label == 'Search Objects') {
            this.searchKey = event.target.value;
            this.hasObject = this.filteredObjList.length > 0 ? true : false
        }
        if (event.target.label == 'Search User Permissions') {
            this.searchUserPermKey = event.target.value;
            this.hasUser = this.filteredUserPermList.length > 0 ? true : false
        }
        if (event.target.label == 'Search Tab Setting') {
            this.searchTabKey = event.target.value;
            this.hasTab = this.filteredTabList.length > 0 ? true : false
        }
        if (event.target.label === 'Search Fields') {
            this.searchFieldKey = event.target.value
            this.hasField = this.filteredFieldList.length > 0 ? true : false
        }

    }
    //This function is used to handle the name and description for cloning profile.
    handleCloneInput(event) {
        //this.isSaveDisabled = false
        if (event.target.name === 'Name') {
            this.labelValue = event.target.value
        } else if (event.target.name === 'description') {
            this.descriptionValue = event.target.value;
        }
    }
    //This function is used to handle the description for Editing properties for Profile
    handleInput(event){
        this.isSaveDisabled = false
        this.descriptionValue = event.target.value;
    }
    //This function is used to handle to close methods for edit property,delete,user permissions & tab permissions
    handleCancel(event) {
        this.isEditClicked = false;
        if (this.isUsersTable === true) {
            this.isUsersTable = false;
        }
        if (this.isdeletetConfirmMessage == true) {
            this.isdeletetConfirmMessage = false;
        }
        this.isSaveDisabled = true;
        this.enableEdit = false;
        this.enableRecTypeEdit = false;
        this.isUpdateEnabled = true;
        this.descriptionValue = '';
        this.labelValue = '';
        this.isCloneProfile = false;
        if (event.target.name === 'User Cancel' && this.tabValue === 'User permissions') {
            this.disabledUserEdit = true;
            this.psSystemMap = {};
            this.systemPermissionSet = JSON.parse(JSON.stringify(this.lastSavedUserPermissions));
        }
        if (event.target.name === 'Tab Cancel') {
            this.changedTablist = [];
            this.tabList = JSON.parse(JSON.stringify(this.lastSavedTab));
        }
        if(event.target.name === 'cloneProfileCancel'){
            this.isClone = true;
        }
    }
    //This function is used to handle to close methods for object permissions.
    handleObjCancel(event) {
        if (event.target.name == 'Object Cancel') {
            this.enableEdit = false;
            this.disabledObjEdit = true;
            this.changedObjPermissions = {};
            this.affectedSobject = [];
            this.objPermissions = JSON.parse(JSON.stringify(this.lastSavedObjPerm))
        }
    }
    //This method is used for updating profile property.
    handleSave() {
        this.showSpinner = true;
        updateProfile({
                profileName: this._profileValue.profileName,
                newDescription: this.descriptionValue
            })
            .then(res => {
                console.log('check res : ', res);
                this._profileValue = {
                    ...this._profileValue,
                    description: res
                }
                this.updatedResult[this._profileValue.profileId] = JSON.parse(JSON.stringify(res));
                this.showSpinner = false;
                this.isEditClicked = false;
                this.descriptionValue = ''
            })
            .catch(err => {
                console.log('err', JSON.stringify(err));
                this.showSpinner = false;
                this.isEditClicked = false;
                this.descriptionValue = ''
            })
    }
    //This Method is Used to clone profile
    handleCloneSave() {
        console.log('OUTPUT : Old Value',JSON.stringify(this._profileValue.profileName));
        console.log('OUTPUT : New Value',JSON.stringify(this.labelValue));
        const labelInput = this.template.querySelector("[data-id='profileNameInput']");
        checkDuplicateProfile({
            label: this.labelValue
        })
            .then(exists => {
                if (exists) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: 'A Profile Name with the same Label or API Name already exists.',
                            variant: 'error'
                        })
                    );
                } else {
                    if (this.labelValue === this._profileValue.profileName) {
                        labelInput.setCustomValidity("New profile name cannot be the same as the original profile name.");
                        labelInput.reportValidity();
                        return;
                    } else {
                        labelInput.setCustomValidity("");
                        labelInput.reportValidity();
                    }
                    this.showSpinner = true;
                    cloneProfile({
                        profileName: this._profileValue.profileName,
                        newProfileName: this.labelValue,
                        newDescription: this.descriptionValue
                    })
                        .then(res => {
                            console.log('Clone profile result : ', JSON.stringify(res));
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'Success',
                                    message: 'Profile Cloned Successfully',
                                    variant: 'success',
                                }),
                            );
                            this.dispatchEvent(new CustomEvent("profilecloneevent", {
                                detail: res,
                                bubbles: true,
                                composed: true,
                            }));
                            this.showSpinner = false;
                            this.isEditClicked = false;
                            this.descriptionValue = '';
                            this.isCloneProfile = false;
                            this.labelValue = '';

                        }).catch(err => {
                            console.log('Clone profile error : ', JSON.stringify(err));
                            let errorMessage = err.body.message;
                            let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'Error',
                                    message: extractedMessage,
                                    variant: 'error'
                                })
                            );
                            this.showSpinner = false;
                            this.isEditClicked = false;
                            this.descriptionValue = '';
                            this.isCloneProfile = false;
                            this.labelValue = '';
                        })
                }
            })
            .catch(error => {
                console.error('Error checking Profile existence: ', error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Failed to check Profile existence. Please try again.',
                        variant: 'error'
                    })
                );
            });
    }
    //This function is used for calling the delete template in html.
    handledeleteClick() {
        this.isdeletetConfirmMessage = true;
    }
    //This function sets the state based on the selected tab (User permissions, Object permissions, or Tab Setting) and invoking the appropriate profile data retrieval method.
    handleTabValue(event) {
        this.tabValue = event.target.value;
        this.hasEditAccess = false;
        this.hasObjEditAccess = false;
        this.enableEdit = false;
        this.showSpinner = true;
        this.systemPermissionSet = [];
        this.tabList = [];
        this.objList = [];
        this.searchUserPermKey = '';
        this.searchFieldKey = ''
        this.searchKey = '';
        this.searchTabKey = '';
        this.hasObject = true;
        this.hasField = true;
        this.hasTab = true;
        this.hasUser = true;
        this.isUpdateEnabled = true;
        if (this.tabValue == 'User permissions') {
            this.hasEditAccess = this._profileValue.isCustom != 'Standard' ? true : false;
            this.getCombinedPermissionsforProfile(this._profileValue.permSetId);
        }
        if (this.tabValue == 'Object permissions') {
            this.hasEditAccess = this._profileValue.profileType != 'CsnOnly' ? true : false;
            this.getProfileObjectDetails(this._profileValue.permSetId);
        }
        if (this.tabValue == 'Tab Setting') {
            this.hasEditAccess = this._profileValue.profileType != 'CsnOnly' ? true : false;
            this.getProfileTabSetting(this._profileValue.profileName);
        }
    }
    //This function retrieves and processes system and user permissions for given permission set Id.
    getCombinedPermissionsforProfile(permSetId) {
        getCombinedPermissionsforProfile({
                permissionSetIds: permSetId
            })
            .then(result => {
                this.systemPermissions = JSON.parse(JSON.stringify(result.systemDependencies));
                this.systemPermissionSet = result.userPermissions.map(info => ({
                    Label: info.fieldLabel,
                    Name: info.fieldName,
                    Value: info.fieldValue
                }));
                this.showUserPerTable = this.systemPermissionSet.length > 0;
                this.showSpinner = false;
                this.systemPermissionSet.sort((a, b) =>
                    a.Label.toLowerCase().localeCompare(b.Label.toLowerCase())
                );
                this.isUserPerm = this.systemPermissionSet.length > 0 ? true : false;
                this.lastSavedUserPermissions = JSON.parse(JSON.stringify(this.systemPermissionSet));
                return this.systemPermissionSet;
            })
            .catch(error => {
                console.error('Error in getCombinedPermissionforPerSet: ', error);
                this.showSpinner = false;
                throw error;
            });

    }
    //This function retrieves, processes, and sorts object and field permissions for a specific permission set and object.
    getSobjectPermissionsForProfile(permSetId, objName) {
        getSobjectPermissionsForProfile({
                permSetId: permSetId,
                objName: objName
            })
            .then(res => {
                console.log('check res' + JSON.stringify(res))
                this.isShowObjectSpinner = false;
                // this.fieldPermissions = res['fieldPermissions'] ? res['fieldPermissions'] : [];
                this.hasObjAccess = res['hasObjAccess'];
                this.hasObjEditAccess = this.hasObjAccess == true && this._profileValue.isCustom == 'Custom' ? true : false;
                this.objectDependencies = res['dependentObj'];
                this.objPermissions = this.objDepPermissions && this.objDepPermissions[objName] ? JSON.parse(JSON.stringify(this.objDepPermissions[objName])) : {
                    PermissionsCreate: false,
                    PermissionsEdit: false,
                    PermissionsRead: false,
                    PermissionsDelete: false,
                    PermissionsModifyAllRecords: false,
                    PermissionsViewAllRecords: false
                };
                this.lastSavedObjPerm = JSON.parse(JSON.stringify(this.objPermissions));
            }).catch(err => {
                console.error('Error in getSobjectPermissionsForProfile: ', err);
                this.isShowObjectSpinner = false;
                throw err;
            })
    }
    //This function retrieves and sorts the tab settings for a specified profile by visibility and label, updates the tab list.
    getProfileTabSetting(profileName) {
        getProfileTabSetting({
                profileName: profileName
            })
            .then(res => {
                console.log('check tab res' + JSON.stringify(res));
                this.showSpinner = false;
                this.tabList = res;
                let visibilityOrder = {
                    'DefaultOn': 1,
                    'DefaultOff': 2,
                    'Hidden': 3
                };
                this.tabList = this.tabList.map(tab => {
                    tab.Visibility = tab.Visibility != null ? tab.Visibility : 'Hidden';
                    return tab;
                }).sort((a, b) => {
                    if (visibilityOrder[a.Visibility] < visibilityOrder[b.Visibility]) {
                        return -1;
                    } else if (visibilityOrder[a.Visibility] > visibilityOrder[b.Visibility]) {
                        return 1;
                    } else {
                        if (a.label < b.label) {
                            return -1;
                        } else if (a.label > b.label) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }
                })
                this.isTab = this.tabList.length > 0 ? true : false;
                this.lastSavedTab = JSON.parse(JSON.stringify(this.tabList));
            }).catch(err => {
                console.error('Error in getProfileTabSetting: ', err);
                this.showSpinner = false;
                throw err;
            })
    }
    //This function retrieves object details and permissions for a profile, sets up object properties (like label, icon, and styles based on access) & sorts the object list by access and label.
    getProfileObjectDetails(permId) {
        getProfileObjectDetails({
                permId: permId
            })
            .then(res => {
                console.log('check res', JSON.stringify(res));
                let entityDef = res['entityDefList'] ? res['entityDefList'] : [];
                this.objDepPermissions = res['objectPermissions'] ? JSON.parse(JSON.stringify(res['objectPermissions'])) : {};
                this.showSpinner = false;
                this.objList = entityDef.map(entity => {
                    return {
                        label: entity.Label,
                        value: entity.QualifiedApiName,
                        isOpen: false,
                        icon: 'utility:chevronright',
                        cursorClass: 'cursor-pointer',
                        hasAccess: this.objDepPermissions && this.objDepPermissions[entity.QualifiedApiName] ? true : false,
                        buttonStyle: this.objDepPermissions && this.objDepPermissions[entity.QualifiedApiName] ? 'background-color : rgb(204 251 241); color : rgb(17 94 89);display: inline-flex;align-items: center;row-gap: 1.5px;padding-left:8px;padding-right:8px;padding-top: 3.5px;padding-bottom: 3.5px;border-radius: 10%;font-size: small;font-weight: bold;border:0px;' : 'background-color : rgb(254 226 226); color: rgb(153 27 27);display: inline-flex;align-items: center;row-gap: 1.5px;padding-left:8px;padding-right:8px;padding-top: 3.5px;padding-bottom: 3.5px;border-radius: 10%;font-size: small;font-weight: bold;border:0px;'
                    }

                }).sort((a, b) => {
                    if (a.hasAccess === b.hasAccess) {
                        return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
                    }
                    return a.hasAccess ? -1 : 1;
                });
            })
            .catch(err => {
                console.log('Error in getCombinedPermissionforPerSet: ', err);
                this.showSpinner = false;
                throw err;
            })
    }
    //This function toggles the accordion state for an object in objList, updating icon and access settings.
    toggleAccordion(event) {
        this.dataSetObject = event.currentTarget.dataset.name;
        const clickedObj = this.objList.find(item => item.value === this.dataSetObject);
        this.objList = this.objList.map(item => {
            if (item.value === this.dataSetObject) {
                const isCurrentlyOpen = item.isOpen;
                return {
                    ...item,
                    isOpen: !isCurrentlyOpen,
                    icon: !isCurrentlyOpen ? 'utility:chevrondown' : 'utility:chevronright',
                    cursorClass: 'cursor-pointer'
                };
            } else {
                return {
                    ...item,
                    isOpen: false,
                    icon: 'utility:chevronright',
                    cursorClass: 'cursor-pointer'
                };
            }
        });
        if (!clickedObj.isOpen) {
            this.objPermissions = {};
            this.fieldPermissions = [];
            this.affectedSobject = [];
            this.isShowObjectSpinner = true;
            this.disabledObjEdit = true;
            this.disabledFieldEdit = true;
            this.hasObjAccess = false;
            this.isField = false;
            this.isEditClicked = false;
            this.enableEdit = false;
            this.hasField = true;
            this.searchFieldKey = '';
            this.isUpdateEnabled = true;
            this.changedRecordType = [];
            this.changedFieldPermissions = [];
            this.changedObjPermissions = {};
            this.hasObjEditAccess = false;
            this.getSobjectPermissionsForProfile(this._profileValue.permSetId, this.dataSetObject);
        }        
    }
    //This function enables edit mode based on the current tab selection, unlocking user or object edit options based on profile type and access permissions.
    handleEdit() {
        this.isUpdateEnabled = true;
        this.enableEdit = true;
        if (this.tabValue == 'User permissions') {
            this.disabledUserEdit = false;
        }
        if (this.tabValue == 'Object permissions') {
            if (this._profileValue.isCustom == 'Custom') {
                this.disabledObjEdit = this.hasObjAccess ? false : true;
            } else {
                this.disabledObjEdit = true;
            }
        }
    }
    //This function updates the system permission value when toggled and marks changes in the psSystemMap to enable updates.
    handlesystemPermissionChangeps(event) {
       const fieldApi = event.target.dataset.fieldapi.replace('Permissions', '');
        const isChecked = event.target.checked;
        this.isUpdateEnabled = false;  
        this.psSystemMap[fieldApi] = isChecked;
        try {
            if (isChecked) {
                this.checkPermissionDependencies(fieldApi);
            } else {                
                this.uncheckPermissionDependencies(fieldApi)
            }
        } catch (error) {
            console.error('Error in handlesystemPermissionChangeps:', error.message || error, error.stack || '');
        }
        this.systemPermissionSet = this.systemPermissionSet.map(user => {
            Object.keys(this.psSystemMap).forEach(key => {
                let permissionKey = "Permissions" + key;
                if (user.Name == permissionKey) {
                    user.Value = this.psSystemMap[key];
                }
            });
            return user;
        })
        console.log('this.psSystemMap : ',JSON.stringify(this.psSystemMap));
    }
    //This method is used to maintain User to User Permission Dependencies to grant parent access if child access is granted    
    checkPermissionDependencies(fieldName) {
        this.systemPermissions.forEach(({
            Permission,
            RequiredPermission
        }) => {
            if (Permission === fieldName) {
                const requiredField = 'Permissions' + RequiredPermission;
                const requiredUserPermission = this.systemPermissionSet.find(obj => obj.Name === requiredField);
                if (requiredUserPermission && !requiredUserPermission.Value) {
                    this.psSystemMap[RequiredPermission] = true;
                    this.checkPermissionDependencies(RequiredPermission);
                }
            }
        });
    }
    //This method is used to maintain User to User Permission Dependencies to remove child access if parent access is removed
    uncheckPermissionDependencies(fieldName) {        
        this.systemPermissions.forEach(({
            Permission,
            RequiredPermission
        }) => {
            if (RequiredPermission === fieldName) {
                const dependentField = 'Permissions' + Permission;
                const dependentPermission = this.systemPermissionSet.find(obj => obj.Name === dependentField);
                if (dependentPermission && dependentPermission.Value) {
                    this.psSystemMap[Permission] = false;
                    this.uncheckPermissionDependencies(Permission);
                }
            }
        });
    }    
    //This function updates the visibility of a tab based on user selection and tracks the changes in the changedTablist.
    handleTabChange(event) {
        this.isUpdateEnabled = false;
        this.tabList = this.tabList.map(tab => {
            if (tab.Name == event.target.dataset.name) {
                tab.Visibility = event.target.value;
                if (!this.changedTablist.includes(tab)) {
                    this.changedTablist.push(tab);
                }
            }
            return tab;
        })
        console.log('check changed tab', JSON.stringify(this.changedTablist));
    }
    //This function updates object permissions based on user input, ensuring related permissions are adjusted, and tracks changes in changedObjPermissions.
    handlePermissionChange(event) {
        this.isUpdateEnabled = false;
        let {
            name,
            checked
        } = event.target;

        switch (name) {
            case 'create':
                this.objPermissions.PermissionsCreate = checked;
                if (checked && !this.objPermissions.PermissionsRead) {
                    this.objPermissions.PermissionsRead = true;
                }
                break;

            case 'edit':
                this.objPermissions.PermissionsEdit = checked;
                if (checked && !this.objPermissions.PermissionsRead) {
                    this.objPermissions.PermissionsRead = true;
                }
                if (!checked) {
                    this.objPermissions.PermissionsDelete = false;
                    this.objPermissions.PermissionsModifyAllRecords = false;
                }
                break;

            case 'read':
                this.objPermissions.PermissionsRead = checked;
                if (!checked) {
                    this.objPermissions.PermissionsCreate = false;
                    this.objPermissions.PermissionsEdit = false;
                    this.objPermissions.PermissionsDelete = false;
                    this.objPermissions.PermissionsViewAllRecords = false;
                    this.objPermissions.PermissionsModifyAllRecords = false;
                }
                break;

            case 'delete':
                this.objPermissions.PermissionsDelete = checked;
                if (checked) {
                    if (!this.objPermissions.PermissionsRead) {
                        this.objPermissions.PermissionsRead = true;
                    }
                    if (!this.objPermissions.PermissionsEdit) {
                        this.objPermissions.PermissionsEdit = true;
                    }
                }
                if (!checked) {
                    this.objPermissions.PermissionsModifyAllRecords = false;
                }
                break;

            case 'viewAllRecords':
                this.objPermissions.PermissionsViewAllRecords = checked;
                if (checked && !this.objPermissions.PermissionsRead) {
                    this.objPermissions.PermissionsRead = true;
                }
                if (!checked) {
                    this.objPermissions.PermissionsModifyAllRecords = false;
                }
                break;

            case 'modifyAllRecords':
                this.objPermissions.PermissionsModifyAllRecords = checked;
                if (checked) {
                    if (!this.objPermissions.PermissionsRead) {
                        this.objPermissions.PermissionsRead = true;
                    }
                    if (!this.objPermissions.PermissionsEdit) {
                        this.objPermissions.PermissionsEdit = true;
                    }
                    if (!this.objPermissions.PermissionsDelete) {
                        this.objPermissions.PermissionsDelete = true;
                    }
                    if (!this.objPermissions.PermissionsViewAllRecords) {
                        this.objPermissions.PermissionsViewAllRecords = true;
                    }
                }
                break;

            default:
        }
        this.changedObjPermissions[this.dataSetObject] = {
            ...this.objPermissions
        };
        if (this.objectDependencies.length > 0) {
            this.handleDependencies(name, checked);
        }
        console.log('Changed permissions::::::', JSON.stringify(this.changedObjPermissions));
    }
    //Helper method for handling dependency.
    handleDependencies(changedPermission, isChecked) {
        const relatedPermissionsCheckMap = {
            read: ['read'],
            edit: ['read', 'edit'],
            delete: ['read', 'edit', 'delete'],
            create: ['read', 'create'],
            viewAllRecords: ['read', 'viewAllRecords'],
            modifyAllRecords: ['read', 'edit', 'delete', 'viewAllRecords', 'modifyAllRecords']
        };

        const relatedPermissionsUncheckMap = {
            read: ['read', 'edit', 'delete', 'viewAllRecords', 'modifyAllRecords', 'create'],
            edit: ['edit', 'delete', 'modifyAllRecords'],
            delete: ['delete', 'modifyAllRecords'],
            create: ['create'],
            viewAllRecords: ['viewAllRecords', 'modifyAllRecords'],
            modifyAllRecords: ['modifyAllRecords']
        };
        const allRelatedPerm = ['read', 'create', 'edit', 'delete', 'viewAllRecords', 'modifyAllRecords']
        let objDependentPerm = JSON.parse(JSON.stringify(this.objDepPermissions));
        const affectedPermissions = [];
        let processedObjects = {}

        try {
            this.objectDependencies.forEach(({
                Permission,
                RequiredPermission
            }) => {
                const [objName, permType] = Permission.split('<');
                const [reqObjName, reqPermType] = RequiredPermission.split('<');

                const checkAndSetParentPermissions = (objectName, permissionType, isChecked) => {
                    if (!objDependentPerm[objectName]) {
                        objDependentPerm[objectName] = {
                            PermissionsRead: false,
                            PermissionsEdit: false,
                            PermissionsDelete: false,
                            PermissionsCreate: false,
                            PermissionsViewAllRecords: false,
                            PermissionsModifyAllRecords: false,
                        };
                    }

                    const valueKey = `Permissions${permissionType.charAt(0).toUpperCase() + permissionType.slice(1)}`;
                    if (!objDependentPerm[objectName][valueKey] && isChecked) {
                        objDependentPerm[objectName][valueKey] = true;
                        affectedPermissions.push(`${objectName}.${valueKey}`);
                        if (!this.objDepPermissions[objectName] || !this.objDepPermissions[objectName][valueKey]) {
                            this.changedObjPermissions[objectName] = objDependentPerm[objectName];
                        }
                    }

                    this.objectDependencies.forEach(dep => {
                        if (dep.Permission === `${objectName}<${permissionType}>`) {
                            const [parentObjName] = dep.RequiredPermission.split('<');
                            checkAndSetParentPermissions(parentObjName, permissionType, isChecked);
                        }
                    });
                };

                const uncheckAndSetChildPermissions = (objectName, permissionType) => {
                    const valueKey = `Permissions${permissionType.charAt(0).toUpperCase() + permissionType.slice(1)}`;
                    if (objDependentPerm[objectName] && objDependentPerm[objectName][valueKey]) {
                        objDependentPerm[objectName][valueKey] = false;
                        affectedPermissions.push(`${objectName}.${valueKey}`);
                        this.changedObjPermissions[objectName] = objDependentPerm[objectName];
                        this.objectDependencies.forEach(dep => {
                            if (dep.RequiredPermission === `${objectName}<${permissionType}>`) {
                                const [childObjName, childPermType] = dep.Permission.split('<');
                                relatedPermissionsUncheckMap[permissionType].forEach(relatedPerm => {
                                    uncheckAndSetChildPermissions(childObjName, relatedPerm);
                                });
                            }
                        });
                    }
                };

                const checkRevertingPermissions = (objectName, reqObjectName, relatedPerm) => {
                    const valueKey = `Permissions${relatedPerm.charAt(0).toUpperCase() + relatedPerm.slice(1)}`;
                    const depPermissionValue = this.objDepPermissions[objectName] ? JSON.parse(JSON.stringify(this.objDepPermissions[objectName])) : {
                        PermissionsRead: false,
                        PermissionsCreate: false,
                        PermissionsEdit: false,
                        PermissionsDelete: false,
                        PermissionsViewAllRecords: false,
                        PermissionsModifyAllRecords: false
                    };
                    processedObjects[objectName] = processedObjects[objectName] ? processedObjects[objectName] : {
                        ...depPermissionValue
                    }
                    if (this.changedObjPermissions[reqObjectName][valueKey] === this.objDepPermissions[reqObjectName][valueKey]) {
                        this.changedObjPermissions[objectName] = processedObjects[objectName];
                    } else {
                        this.changedObjPermissions[objectName][valueKey] = this.changedObjPermissions[reqObjectName][valueKey];

                        if (!this.changedObjPermissions[objectName][valueKey]) {
                            relatedPermissionsUncheckMap[relatedPerm].forEach(depPerm => {
                                const depValueKey = `Permissions${depPerm.charAt(0).toUpperCase() + depPerm.slice(1)}`;
                                this.changedObjPermissions[objectName][depValueKey] = false;
                                processedObjects[objectName][depValueKey] = this.changedObjPermissions[objectName][depValueKey];
                            });
                        }
                    }
                    this.objectDependencies.forEach(dep => {
                        if (dep.RequiredPermission === `${objectName}<${relatedPerm}>`) {
                            const [childObjName] = dep.Permission.split('<');
                            if (this.changedObjPermissions[childObjName]) {
                                checkRevertingPermissions(childObjName, objectName, relatedPerm);
                            }
                        }
                    })
                }
                const uncheckRevertingPermissions = (requiredObjectName, objectName, relatedPerm) => {
                    const depPermissionValue = this.objDepPermissions[requiredObjectName] ? this.objDepPermissions[requiredObjectName] : {
                        PermissionsRead: false,
                        PermissionsCreate: false,
                        PermissionsEdit: false,
                        PermissionsDelete: false,
                        PermissionsViewAllRecords: false,
                        PermissionsModifyAllRecords: false
                    };
                    const reqPermission = this.objDepPermissions[objectName] ? JSON.parse(JSON.stringify(this.objDepPermissions[objectName])) : {
                        PermissionsRead: false,
                        PermissionsCreate: false,
                        PermissionsEdit: false,
                        PermissionsDelete: false,
                        PermissionsViewAllRecords: false,
                        PermissionsModifyAllRecords: false
                    };

                    const valueKey = `Permissions${relatedPerm.charAt(0).toUpperCase() + relatedPerm.slice(1)}`;
                    if (this.changedObjPermissions[objectName][valueKey] === reqPermission[valueKey]) {
                        this.changedObjPermissions[requiredObjectName][valueKey] = depPermissionValue[valueKey];
                    }
                    this.objectDependencies.forEach(dep => {
                        if (dep.Permission === `${requiredObjectName}<${relatedPerm}>`) {
                            const [parentObjName] = dep.RequiredPermission.split('<');
                            if (this.changedObjPermissions[parentObjName]) {
                                uncheckRevertingPermissions(parentObjName, requiredObjectName, relatedPerm);
                            }
                        }
                    })
                }
                if (isChecked && objName === this.dataSetObject) {
                    if (relatedPermissionsCheckMap[changedPermission]) {
                        relatedPermissionsCheckMap[changedPermission].forEach(relatedPerm => {
                            if (RequiredPermission.includes(`${reqObjName}<${relatedPerm}>`)) {
                                checkAndSetParentPermissions(reqObjName, relatedPerm, isChecked);
                            }
                        });
                    }
                }
                if (isChecked && reqObjName === this.dataSetObject && this.changedObjPermissions[objName]) {
                    allRelatedPerm.forEach(relatedPerm => {
                        const permissionKey = `${objName}<${relatedPerm}>`;
                        if (Permission.includes(permissionKey)) {
                            checkRevertingPermissions(objName, reqObjName, relatedPerm);
                        }
                    })
                }
                if (!isChecked && reqObjName === this.dataSetObject) {
                    if (RequiredPermission.includes(`${reqObjName}<${changedPermission}>`)) {
                        if (relatedPermissionsUncheckMap[changedPermission]) {
                            relatedPermissionsUncheckMap[changedPermission].forEach(relatedPerm => {
                                const valueKey = `Permissions${relatedPerm.charAt(0).toUpperCase() + relatedPerm.slice(1)}`;
                                if (this.objDepPermissions[objName] && this.objDepPermissions[objName][valueKey]) {
                                    uncheckAndSetChildPermissions(objName, relatedPerm);
                                }
                            });
                        }
                    }
                }
                if (!isChecked && objName == this.dataSetObject && this.changedObjPermissions[reqObjName]) {
                    allRelatedPerm.forEach(relatedPerm => {
                        const permissionKey = `${objName}<${relatedPerm}>`;
                        if (Permission.includes(permissionKey)) {
                            uncheckRevertingPermissions(reqObjName, objName, relatedPerm);
                        }
                    })
                }
            });
        } catch (error) {
            console.error('Error in handleDependencies:', error.message || error, error.stack || '');
        }
    }
    //This function updates field permissions based on user input, ensures dependencies are maintained, and tracks changes in changedFieldPermissions.
    handleFieldPermChange(event) {
        this.isUpdateEnabled = false;
        this.fieldPermissions = this.fieldPermissions.map(field => {
            if (field.Field === event.target.dataset.name) {
                field[event.target.name] = event.target.checked;
                if (event.target.name == 'PermissionsRead' && !event.target.checked) {
                    field.PermissionsEdit = false;
                }
                if (event.target.name === 'PermissionsEdit' && event.target.checked) {
                    field.PermissionsRead = true;
                }
                if (!this.changedFieldPermissions.includes(field)) {
                    this.changedFieldPermissions.push(field);
                }
            }
            return field;
        });
        
    }
    //This method asynchronously updates user, tab, or object permissions based on the event type  
    async handleUpdatePermissionSet(event) {
        
        if (event.target.name == 'User Update') {
            this.showSpinner = true;
            updateSystemPermissionsProf({
                    profileName: this._profileValue.profileName,
                    systemPermissions: this.psSystemMap
                })
                .then(res => {
                    console.log('check update res', JSON.stringify(res));
                    this.showSpinner = false;
                    this.disabledUserEdit = true;
                    this.psSystemMap = {};
                    this.enableEdit = false;
                    this.isUpdateEnabled = true;
                    for (const [key, value] of Object.entries(res)) {
                        const fieldName = 'permission' + key;
                        if (this.systemPermissionSet.hasOwnProperty(fieldName)) {
                            this.systemPermissionSet[fieldName] = value;
                        }
                    }
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Successfully updated user permissions',
                            variant: 'success'
                        })
                    );                    
                    this.lastSavedUserPermissions = JSON.parse(JSON.stringify(this.systemPermissionSet));
                })
                .catch(error => {                  
                    let errorMessage = error.body.message;
                    let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: extractedMessage,
                            variant: 'error'
                        })
                    );
                    this.systemPermissionSet = JSON.parse(JSON.stringify(this.lastSavedUserPermissions));
                    this.showSpinner = false;
                    this.disabledUserEdit = true;
                    this.enableEdit = false;
                    this.psSystemMap = {};
                    this.isUpdateEnabled = true;
                });
        }
        if (event.target.name == 'Tab Update') {
            this.showSpinner = true;
            updateTabSettings({
                    profileNames: this._profileValue.profileName,
                    tabToUpdate: this.changedTablist
                })
                .then(res => {
                    console.log('check tab update res', res);
                    this.showSpinner = false;
                    this.enableEdit = false;
                    this.isUpdateEnabled = true;
                    this.tabList = this.tabList.map(tab => {
                        let updateTab = this.changedTablist.find(e => e.Name === tab.Name)
                        return updateTab ? updateTab : tab;
                    })
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Successfully updated tab settings',
                            variant: 'success'
                        })
                    );
                    this.lastSavedTab = JSON.parse(JSON.stringify(this.tabList));
                    this.changedTablist = [];
                }).catch(err => {
                    console.log('check tab update err', JSON.stringify(err));
                    this.tabList = JSON.parse(JSON.stringify(this.lastSavedTab));
                    let errorMessage = err.body.message;
                    let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: extractedMessage,
                            variant: 'error'
                        })
                    );
                    this.showSpinner = false;
                    this.enableEdit = false
                    this.changedTablist = [];
                    this.isUpdateEnabled = true;
                })
        }
        if (event.target.name == 'Object Update') {
            this.isShowObjectSpinner = true;
            for (let key in this.changedObjPermissions) {
                if (key != this.dataSetObject) {
                    this.affectedSobject.push(key);
                }
            }            
            if (this.affectedSobject.length > 0) {
                let arrayString = this.affectedSobject.join(', ');
                const maxLength = 300;
                if (arrayString.length > maxLength) {
                    arrayString = arrayString.substring(0, maxLength) + '...';
                }
                const result = await LightningConfirm.open({
                    message: `${arrayString} These objects will be impacted after saving the records. Are you sure you want to change it?`,
                    variant: 'default',
                    label: "Affected Objects"
                });
                if (result) {
                    this.objUpdateHandler(this.changedObjPermissions, this._profileValue.permSetId)
                } else {
                    this.objPermissions = JSON.parse(JSON.stringify(this.lastSavedObjPerm));
                    this.isShowObjectSpinner = false;
                    this.disabledObjEdit = true;
                    this.isUpdateEnabled = true;
                    this.enableEdit = false;
                    this.changedObjPermissions = {};
                    this.affectedSobject = [];
                }
            } else {
                this.objUpdateHandler(this.changedObjPermissions, this._profileValue.permSetId)
            }

        }

    }
    //This handler method updates object and field permissions
    objUpdateHandler(objMap,permSetId) {
        updateObjPermissions({
                objPerms: objMap,
                permSetId: permSetId
            })
            .then(res => {
                console.log('check res' + JSON.stringify(res));
                console.log('dataSetObject before update: ',JSON.stringify(this.objDepPermissions[this.dataSetObject]));
                if (res != null) {
                    if (res != null && res != undefined) {
                        if (res[this.dataSetObject]) {
                            this.objPermissions = res[this.dataSetObject];
                        }
                        Object.keys(res).forEach((key) => {
                            this.objDepPermissions[key] = res[key];
                        })
                    }
                    console.log('dataSetObject after update: ',JSON.stringify(this.objDepPermissions[this.dataSetObject]));
                    this.isShowObjectSpinner = false;
                    this.disabledObjEdit = true;
                    this.isUpdateEnabled = true;
                    this.enableEdit = false;
                    this.changedObjPermissions = {};
                    this.affectedSobject = [];
                    this.lastSavedObjPerm = JSON.parse(JSON.stringify(this.objPermissions));
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Successfully Upserted Object Permissions',
                            variant: 'success'
                        })
                    );
                } else {
                    this.objPermissions = JSON.parse(JSON.stringify(this.lastSavedObjPerm));
                    this.isShowObjectSpinner = false;
                    this.disabledObjEdit = true;
                    this.isUpdateEnabled = true;
                    this.enableEdit = false;
                    this.changedObjPermissions = {};
                    this.affectedSobject = [];
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: 'Contact System Admin',
                            variant: 'error'
                        })
                    );
                }
            })
            .catch(err => {
                console.log('check Object update err', err);
                this.objPermissions = JSON.parse(JSON.stringify(this.lastSavedObjPerm));
                this.isShowObjectSpinner = false;
                this.disabledObjEdit = true;
                this.isUpdateEnabled = true;
                this.enableEdit = false;
                this.changedObjPermissions = {};
                this.affectedSobject = [];
                let errorMessage = err.body.message;
                let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: extractedMessage,
                        variant: 'error'
                    })
                );
            })
    }
    //This method is used for deleting a profile
    handledeleteconfirm() {
        this.isdeletetConfirmMessage = false;
        deleteProfile({
                profileName: this._profileValue.profileName
            })
            .then(res => {
                console.log('Check Result', res);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Profile Deleted Successfully',
                        variant: 'success',
                    }),
                );
                location.reload();
            })
            .catch(error => {
                let errorMessage = error.body.message;
                let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: extractedMessage,
                        variant: 'error'
                    })
                );
            })
    }

    handleConvertPermissionSet() {
        this.isClone = false;
        this.isCreatePerSetClicked = true;
    }

    //This function updates the createPermissionSetObj fields based on input values for label, API name, and description, ensuring the API name follows the required format.
    handleInputCreatePerSet(event) {
        const field = event.target.dataset.id;
        const value = event.target.value;

        if (field === 'label') {
            console.log('OUTPUT INPUT CREATE : ', value);
            this.createPermissionSetObj.Label = value;
            if (value) {
                this.createPermissionSetObj.Name = value.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') + '_c';
                this.isCreateDisabled = false;
            } else {
                this.createPermissionSetObj.Name = '';
                this.isCreateDisabled = true;
            }
        } else if (field === 'apiName') {
            this.createPermissionSetObj.Name = value.replace(/[^a-zA-Z0-9_]/g, '');
        } else if (field === 'description') {
            this.createPermissionSetObj.Description = value;
        }
    }

    //This function is used for closing any related modals and clearing selected values and search terms.
    closeModal() {
        this.isCreatePerSetClicked = false;
        this.isCreateDisabled = true;
        this.createPermissionSetObj = {};
    }

    //This Function is used for convert profile to permissionSet 
    handleConvertPermissionSetSave(){
        this.showSpinner = true;
        getProfilePermsToCovertPermSet({profileName:this._profileValue.profileName, permSetToCreate:this.createPermissionSetObj})
        .then(res=>{
            console.log('res for converted permission set : ',res);
            this.closeModal();
            this.showSpinner = false;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'PermissionSet Converted Successfully',
                    variant: 'success',
                }),
            );
        }).catch(error=>{
            console.log('err for converted permission set : ', error);
            this.closeModal();
            this.showSpinner = false;
            let errorMessage = error.body.message;
            let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: extractedMessage,
                    variant: 'error'
                })
            );
        })
    }

    //This method is used to handle the hasActivationRequired field for new PermissionSet Creation
    handleSessionChange(event) {
        this.createPermissionSetObj.hasActivationRequired = event.target.checked;
        this.isSessionChecked = event.target.checked;
    }
    
    handleClose(){
        this.isClone = false;
    }

}