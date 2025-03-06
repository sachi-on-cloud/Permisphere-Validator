import {LightningElement,track, wire} from 'lwc';
import getUser from '@salesforce/apex/PermissionAnalyzerServer.getUser';
import getUserRelatedPermissionSets from '@salesforce/apex/PermissionAnalyzerServer.getUserRelatedPermissionSets';
import getCombinedObjAndFieldPermsForUser from '@salesforce/apex/PermissionAnalyzerServer.getCombinedObjAndFieldPermsForUser';
import getObjectDefinition from '@salesforce/apex/PermissionTabServer.getObjectDefinition';
import getUserDefinitions from '@salesforce/apex/PermissionTabServer.getUserDefinitions';
import getEntityDefinition from '@salesforce/apex/PermissionAnalyzerServer.getEntityDefinition';
import getProfileName from '@salesforce/apex/PermissionAnalyzerServer.getProfileName';
import getAssignedUsersForProfilePerSetPerSetGrp from '@salesforce/apex/PermissionAnalyzerServer.getAssignedUsersForProfilePerSetPerSetGrp';
import editPermSetGrpProperties from '@salesforce/apex/PermissionAnalyzerServer.editPermSetGrpProperties';
import editPermSetProperties from '@salesforce/apex/PermissionAnalyzerServer.editPermSetProperties';
import editProfileProperties from '@salesforce/apex/PermissionAnalyzerServer.editProfileProperties';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import { subscribe, unsubscribe, MessageContext } from 'lightning/messageService';
import THEME_CHANNEL from '@salesforce/messageChannel/ThemeChannel__c';
import { debounce } from 'c/utils';
const actions = [{
    label: 'Show User Permissions',
    name: 'show_user_Perms'
}, ];
export default class PermissionAnalyzer extends LightningElement {

    @track searchusername = '';
    @track searchPerSetGrpName = '';
    selectedUserPermissionTypeLabel = ''
    username;
    perSetGrpName;
    @track isUserObject = false;
    isPermissionObj = false;
    userNameClick = true;
    isPermSetSelected = false;
    csnOnlyUser = false;
    isPermissionSetTemp = false;
    isPermissionSetGroupTemp = false;
    isSelected = false;
    isPermissionSetName = false;
    isPermissionSetGroupName = false;
    isUserNameForPermission = false;
    userId;
    userProfileId;
    allow = true
    userProfileValue;
    selectedOptionValue = 'All';
    userPermissionSetValue = '';
    userPermissionSetGroupValue = '';
    permissionSetIdList = [];
    permissionSetsList = [];
    isPermissionEnabledUser = true;
    entityDefObject = [];
    permId = '';
    userObjectOptions;
    selectedUserProfileLabel;
    selectedUserPermissionSetLabel;
    selectedUserPermissionSetGroupLabel;
    @track userPermissselectedOptionsionOptions = [];
    @track selectedPermissionType = [];
    @track userPermissionSetOption = [];
    @track userPermissionSetGroupOption = [];
    @track sortBy;
    @track sortDirection;
    permSetGroupId = ''
    @track selectedObjectType = 'Native';
    showMessage = false;
    showSpinner = false;
    activeTabPrimary = 'User'
    permissionSetTypeId = [];
    groupTypeId = [];
    permissionSetArrayList = [];
    profileTypeName = ''
    enableObjAndFieldEditAccess = false
    enableTabSetting = false
    enableRecordTypeEdit = false;
    enableMutePermissions = false;
    enableDefault = false;
    enableHelpText = true;
    isCustomProfile = false;
    isProfile = false;
    isCustomPermSet = {};
    showChild;
    hasEntityDef = false;
    metadataPermissions;
    selecteduserLabel;
    selecteduserDescription;
    selecteduserApiName;
    selecteduserLicense;
    selecteduserType;
    selectedUserApiNameWithNameSpace;
    profileList = [];
    permissionSetList = [];
    groupList = [];
    isUsersTable = false;
    @track uservalue;
    @track userValueLength;
    isEditClicked = false;
    labelValue = '';
    descriptionValue = '';
    apiNameValue = '';
    isProfileEdit = false;
    isPermissionSetEdit = false;
    isPermissionSetGroupEdit = false;
    @track isStandard = false;
    isSaveDisabled = true;
    permIdsToFetchUserPerms = [];
    activePermTab = "Object"
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
    selectedPermissionType = [{
            label: "All",
            value: "All",
            type: "text"
        },
        {
            label: "Profile",
            value: "Profile",
            type: "text"
        },
        {
            label: "Permission Set",
            value: "Permissionset",
            type: "text"
        },
        {
            label: "Permission Set Group",
            value: "Permissionsetgroup",
            type: "text"
        }
    ];

    permissionTypeOptions = [{
            label: "User",
            value: "User",
            type: "text"
        },
        {
            label: "Object",
            value: "Object",
            type: "text"
        },
        {
            label: "Field",
            value: "Field",
            type: "text"
        }
    ];
    objectPermissionOptions = [{
            label: "Create",
            value: "PermissionsCreate",
            type: "text"
        },
        {
            label: "Read",
            value: "PermissionsRead",
            type: "text"
        },
        {
            label: "Edit",
            value: "PermissionsEdit",
            type: "text"
        },
        {
            label: "Delete",
            value: "PermissionsDelete",
            type: "text"
        },
        {
            label: "View All Records",
            value: "PermissionsViewAllRecords",
            type: "text"
        },
        {
            label: "Modify All Records",
            value: "PermissionsModifyAllRecords",
            type: "text"
        }
    ];
    fieldPermissionOptions = [{
            label: "Read",
            value: "PermissionsRead",
            type: "text"
        },
        {
            label: "Edit",
            value: "PermissionsEdit",
            type: "text"
        }
    ];
    activeOptions = [{
            label: "Active",
            value: ""
        },
        {
            label: "Yes",
            value: "Active"
        },
        {
            label: "No",
            value: "Inactive"
        },
    ]

    datacolumns = [{
            label: 'Full Name',
            fieldName: 'Name',
            sortable: true,
            hideLabel: true,
        },
        {
            label: 'User Name',
            fieldName: 'Username',
            sortable: true,
            hideLabel: true,
        },
        {
            label: 'Title',
            fieldName: 'Title',
            sortable: true,
            hideLabel: true,
        },
        {
            label: 'Role Name',
            fieldName: 'Department',
            sortable: true,
            hideLabel: true,
        },
        {
            label: 'Alias',
            fieldName: 'Alias',
            sortable: true,
            hideLabel: true,
        },
        {
            label: 'Profile',
            fieldName: 'profileName',
            sortable: true,
            hideLabel: true,
        },
        {
            label: 'Active',
            fieldName: 'IsActive',
            type: 'boolean',
            sortable: true,
            hideLabel: true,
        },
        {
            label: 'Last Login',
            fieldName: 'LastLoginDate',
            type: 'date',
            sortable: true,
            typeAttributes: {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
            },
            hideLabel: true,
        },
        {
            label: 'License',
            fieldName: 'LicenseName',
            sortable: true,
            hideLabel: true,
        },
        {
            type: 'action',
            typeAttributes: {
                rowActions: actions
            },
        },

    ]

    perSetGrpcolumns = [{
            label: 'Name',
            fieldName: 'DeveloperName',
        },
        {
            label: 'Label',
            fieldName: 'MasterLabel',
        },
        {
            label: 'Description',
            fieldName: 'Description',
        },
        {
            label: 'Status',
            fieldName: 'Status',
        },
        {
            label: 'NamespacePrefix',
            fieldName: 'NamespacePrefix',
        },
        {
            label: 'Created By',
            fieldName: 'CreatedByName',
        },
        {
            label: 'Created Date',
            fieldName: 'CreatedDate',
            type: 'date',
            typeAttributes: {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
            },
        },
        {
            label: 'Last Modified By',
            fieldName: 'lastModifiedByName',
        },
        {
            label: 'Last Modified Date',
            fieldName: 'LastModifiedDate',
            type: 'date',
            typeAttributes: {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
            },
        }
    ]

    @track objTypeOptions = [{
            label: 'Native',
            value: 'Native'
        },
        {
            label: 'Managed Package',
            value: 'ManagedPackage'
        }
    ];

    @wire(MessageContext)
    messageContext;

    subscription = null;

    // Cache management
    searchCache = new Map();
    permissionCache = new Map();
    
    // Debounced search handler
    handleUserSearch = debounce((searchTerm) => {
        this.performSearch(searchTerm);
    }, 300);

    connectedCallback() {
        // Get initial theme color from localStorage
        const storedColor = localStorage.getItem('themeColor');
        if (storedColor) {
            this.updateThemeColors(storedColor);
        }

        // Subscribe to theme changes
        this.subscribeToThemeChannel();
    }

    disconnectedCallback() {
        // Unsubscribe from theme channel
        this.unsubscribeFromThemeChannel();
        this.clearCaches();
        this.unsubscribeFromEvents();
    }

    subscribeToThemeChannel() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                THEME_CHANNEL,
                (message) => this.handleThemeChange(message)
            );
        }
    }

    unsubscribeFromThemeChannel() {
        if (this.subscription) {
            unsubscribe(this.subscription);
            this.subscription = null;
        }
    }

    handleThemeChange(message) {
        if (message.color) {
            this.updateThemeColors(message.color);
        }
    }

    updateThemeColors(color) {
        // Update SLDS brand color
        document.documentElement.style.setProperty('--lwc-brandPrimary', color);
        
        // Update component's theme color
        const hostElement = this.template.host;
        if (hostElement) {
            hostElement.style.setProperty('--theme-color', color);
        }
    }

    //This Method is used to update the object Type Combobox in Ui --- Native/Manage
    handleObjectTypeChange(event) {
        this.selectedObjectType = event.target.value;
        if (this.selectedObjectType) {
            this.showSpinner = true;
        }
        this.objTypeChangeHandler(this.selectedObjectType);
    }
    //This Method is used to handle the object change based on Native/Managed Package and call EntityDefinition result through server
    objTypeChangeHandler(objType) {
        getEntityDefinition({
                objType: objType
            })
            .then(res => {
                console.log('entity def result', res);
                this.entityDefObject = res;
                this.entityDefObject = this.entityDefObject.map(e => {
                    let accessDetails = this.metadataPermissions[e.QualifiedApiName] ? this.checkAllAccess(this.metadataPermissions[e.QualifiedApiName]) : {
                        hasAllAccess: false,
                        hasAnyoneAccess: false,
                        noAccess: true
                    };
                    return {
                        label: e.Label,
                        value: e.QualifiedApiName,
                        isOpen: false,
                        icon: 'utility:chevronright',
                        cursorClass: 'cursor-pointer',
                        hasAllAccess: accessDetails.hasAllAccess,
                        hasAnyoneAccess: accessDetails.hasAnyOneAccess,
                        noAccess: accessDetails.noAccess,
                        buttonStyle: accessDetails.hasAllAccess ? 'background-color : rgb(204 251 241); color : rgb(17 94 89);display: inline-flex;align-items: center;row-gap: 1.5px;padding-left:8px;padding-right:8px;padding-top: 3.5px;padding-bottom: 3.5px;border-radius: 10%;font-size: small;font-weight: bold;border:0px;' : accessDetails.hasAnyoneAccess ? 'background-color : lightgoldenrodyellow; color: rgb(133 77 14);display: inline-flex;align-items: center;row-gap: 1.5px;padding-left:8px;padding-right:8px;padding-top: 3.5px;padding-bottom: 3.5px;border-radius: 10%;font-size: small;font-weight: bold;border:0px;' : 'background-color : rgb(254 226 226); color: rgb(153 27 27);display: inline-flex;align-items: center;row-gap: 1.5px;padding-left:8px;padding-right:8px;padding-top: 3.5px;padding-bottom: 3.5px;border-radius: 10%;font-size: small;font-weight: bold;border:0px;',
                    };
                })
                this.entityDefObject.sort((a, b) => {
                    if (a.hasAllAccess && !b.hasAllAccess) {
                        return -1;
                    } else if (!a.hasAllAccess && b.hasAllAccess) {
                        return 1;
                    } else if (a.hasAnyoneAccess && !b.hasAnyoneAccess) {
                        return -1;
                    } else if (!a.hasAnyoneAccess && b.hasAnyoneAccess) {
                        return 1;
                    } else if (a.noAccess && !b.noAccess) {
                        return 1;
                    } else if (!a.noAccess && b.noAccess) {
                        return -1;
                    }
                    return 0;
                });

                if (this.entityDefObject.length > 0) {
                    this.showSpinner = false;
                    this.isPermissionObj = true;
                    this.showChild = true;
                    this.hasEntityDef = true;
                } else {
                    this.showSpinner = false;
                    //this.showChild = false
                    this.hasEntityDef = false;
                }
            })
    }
    //Helper Method to check the access and used to sort and colour code the objects based on Object and Field Permissions
    checkAllAccess(permission) {
        let hasObjectAccess =
            permission.objectPermissions &&
            (permission.objectPermissions.PermissionsRead ||
                permission.objectPermissions.PermissionsCreate ||
                permission.objectPermissions.PermissionsEdit ||
                permission.objectPermissions.PermissionsDelete ||
                permission.objectPermissions.PermissionsViewAllRecords ||
                permission.objectPermissions.PermissionsModifyAllRecords)

        let hasFieldAccess =
            permission.fieldPermissions &&
            Object.values(permission.fieldPermissions).some(fieldPerm => fieldPerm.PermissionsRead || fieldPerm.PermissionsEdit);
        return {
            hasAllAccess: hasObjectAccess && hasFieldAccess,
            hasAnyOneAccess: (hasObjectAccess || hasFieldAccess) && !(hasObjectAccess && hasFieldAccess),
            noAccess: !hasObjectAccess && !hasFieldAccess,
        }

    }
    //This Method is used to handle the PermissionType change Profile/PermissionSet/PermissionSetGroup
    handleSelectedPermissionTypeOption(event) {
        this.selectedOptionValue = event.target.value;
        if (this.selectedOptionValue == 'Permissionset') {
            this.isProfile = false;
            this.activePermTab = 'Object'
            this.isPermissionSetTemp = true;
            this.isPermissionSetGroupTemp = false;
            this.isPermissionObj = false;
            this.isPermSetSelected = false
            this.isPermissionSetGroupName = false;
            this.userNameClick = false;
            this.isPermissionSetName = true;
            this.isUserNameForPermission = false;
            this.profileTypeName = '';
            this.enableObjAndFieldEditAccess = false
            this.enableTabSetting = false  
            this.enableDefault = false;
            this.enableMutePermissions = false
            this.enableRecordTypeEdit = false;
            this.enableHelpText = true
            this.permId = ''
            this.showSpinner = true;
            this.userPermissionSetValue = 'PermAll';
            this.selectedUserPermissionTypeLabel = 'All';
            this.permSetGroupId = '';
            this.permIdsToFetchUserPerms = this.permissionSetTypeId;
            if (this.permissionSetTypeId.length > 0) {
                this.showChild = true;
                this.handleGetObjectHelper(this.permissionSetTypeId);
            }
            if (this.permissionSetTypeId.length == 0) {
                this.showChild = false;
                this.isPermissionObj = true;
                this.showSpinner = false;
            }
        }

        if (this.selectedOptionValue == 'Permissionsetgroup') {
            this.isProfile = false;
            this.activePermTab = 'Object'
            this.isPermissionSetTemp = false;
            this.isPermissionSetGroupTemp = true;
            this.isPermissionObj = false;
            this.permId = '';
            this.userPermissionSetGroupValue = 'GroupAll';
            this.isPermSetSelected = false;
            this.isPermissionSetGroupName = true;
            this.isPermissionSetName = false;
            this.isUserNameForPermission = false;
            this.userNameClick = false;
            this.selectedUserPermissionTypeLabel = 'All';
            this.enableObjAndFieldEditAccess = false;
            this.enableTabSetting = false;
            this.enableDefault = false;
            this.profileTypeName = '';
            this.enableMutePermissions = false;
            this.enableRecordTypeEdit = false;
            this.enableHelpText = true;
            this.showSpinner = true;
            this.permSetGroupId = '';
            this.permIdsToFetchUserPerms = this.groupTypeId;
            if (this.groupTypeId.length > 0) {
                this.showChild = true;
                this.handleGetObjectHelper(this.groupTypeId);
            }
            if (this.groupTypeId.length == 0) {
                this.isPermissionObj = true;
                this.showChild = false;
                this.showSpinner = false;
            }
        }
        if (this.selectedOptionValue == 'Profile') {
            this.isProfile = true;
            this.isPermissionSetTemp = false;
            this.showChild = true
            this.permSetGroupId = '';
            this.isPermissionSetGroupTemp = false;
            this.handleProfileUser();
            this.activePermTab = 'Object'
            this.handleProfName(this.userProfileId);
            this.handleUserChange(this.permId);
        }
        if (this.selectedOptionValue == 'All') {
            this.isProfile = false;
            this.isPermissionSetGroupName = false;
            this.isPermissionSetName = false;
            this.isPermissionSetTemp = false;
            this.isPermissionSetGroupTemp = false;
            this.showSpinner = true;
            this.isPermissionObj = false;
            this.showChild = true;
            this.enableObjAndFieldEditAccess = false;
            this.enableTabSetting = false;
            this.enableDefault = false;
            this.profileTypeName = '';
            this.enableMutePermissions = false;
            this.enableRecordTypeEdit = false;
            this.enableHelpText = true
            this.isUserNameForPermission = false;
            this.permId = ''
            this.activePermTab = 'Object'
            this.selectedObjectType = 'Native';
            this.userNameClick = true;
            this.isPermSetSelected = false;
            this.permSetGroupId = '';
            this.handleGetObjectHelper(this.permissionSetIdList);
            this.permIdsToFetchUserPerms = this.permissionSetIdList;
        }
    }
    //This Method is to get user Permissions and Object List for PermissionHub Tab call
    handlePermissionListValues(event) {
        this.showSpinner = true;
        this.activeTabPrimary = event.target.value;
        getUserDefinitions()
            .then(res => {
                this.showSpinner = false;
                let arr = []
                for (let key in res) {
                    arr.push({
                        label: res[key],
                        value: key,
                        isClicked: false,
                    })
                }
                this.userPermissionOptions = arr.sort((a, b) => {
                    if (a.label < b.label) {
                        return -1;
                    } else if (a.label > b.label) {
                        return 1;
                    }
                    return 0;
                });
            })

        getObjectDefinition()
            .then(res => {
                console.log('res new class Object', res);
                if (res.length > 0) {
                    this.userObjectOptions = res.map(elem => ({
                        label: elem.Label,
                        value: elem.QualifiedApiName
                    }))
                }
            })
    }
    //This Method is used to clear the User Tab
    handleUserClear() {
        this.isSelected = false;
        this.isPermissionObj = false;
        this.isPermissionEnabledUser = true;
        this.permissionSetIdList = [];
        this.permissionSetsList = [];
        this.selectedObjectType = 'Native'
        this.userPermissionSetOption = [];
        this.userPermissionSetGroupOption = [];
        this.permId = '';
        this.userPermissionSetValue = '';
        this.userPermissionSetGroupValue = ''
        this.userProfileValue = '';
        this.userNameClick = false;
        this.isPermSetSelected = false;
        this.isCustomProfile = false;
        this.isCustomPermSet = {};
        this.selectedUserPermissionTypeLabel = ''
        this.isPermissionSetTemp = false;
        this.isPermissionSetGroupTemp = false;
        this.isPermissionSetName = false;
        this.isPermissionSetGroupName = false;
        this.selectedOptionValue = 'All';
        this.permissionSetTypeId = [];
        this.groupTypeId = [];
        this.enableObjAndFieldEditAccess = false
        this.enableTabSetting = false
        this.enableDefault = false;
        this.profileTypeName = '';
        this.enableMutePermissions = false
        this.enableRecordTypeEdit = false
        this.enableHelpText = true;
        this.showChild = false
        this.permSetGroupId = '';
    }
    //This Method is called from Child to navigate to user from Permission to User Tab
    handleUserRowAction(event) {
        this.handleUserClear();
        this.activeTabPrimary = 'User'
        this.userId = event.target.dataset.id || event.detail.id;
        this.searchusername = event.target.dataset.name || event.detail.name;
        this.showSpinner = true;
        this.isUserObject = false;
        this.isPermissionEnabledUser = false;
        this.isSelected = true;
        this.selectedOptionValue = 'All';
        this.handleGetUserPermsWrapper(this.userId);
        this.isUserNameForPermission = true;
    }
    //This function will used to sort data by direction.
    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }
    //Helper method for sorting data
    sortData(fieldName, sortDirection) {
        let data1 = JSON.parse(JSON.stringify(this.uservalue));
        let keyValue = (a) => a[fieldName];
        let isReverse = sortDirection === 'asc' ? 1 : -1;

        data1.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : '';
            y = keyValue(y) ? keyValue(y) : '';
            return isReverse * ((x > y) - (y > x));
        });
        this.uservalue = data1;
    }
    //This Method is used to manage the users based on search name
    manageUser(userName) {
        getUser({
                searchUserName: userName
            })
            .then(res => {
                this.username = res;
                console.log('OUTPUT : res',JSON.stringify(res));
                this.isUserObject = this.allow && res.length > 0 ? true : false;
                this.showMessage = res.length === 0;
            })
            .catch(err => {
                console.log(err);
            })
    }
    //This Method is used to handle active User Tab
    handleUserTab() {
        this.permissionTypeValue = 'User';
    }
    //This Method is used to get all Profile,permissionset and group
    handleGetUserPermsWrapper(userId) {
        getUserRelatedPermissionSets({
                userId: userId
            })
            .then(res => {
                console.log('check res please ' + JSON.stringify(res));
                if (res.length > 0) {
                    this.permissionSetArrayList = res;
                    let permissionSetType = [{
                        label: 'All',
                        value: 'PermAll'
                    }];
                    let groupType = [{
                        label: 'All',
                        value: 'GroupAll'
                    }];
                    this.permissionSetArrayList.forEach(obj => {
                        this.permissionSetIdList.push(obj.Id)
                        if (obj.Type == 'Profile') {
                            this.selectedUserProfileLabel = obj.Profile.Name;
                            this.profileList.push({
                                label: obj.Profile.Name,
                                value: obj.Id,
                                isCustom: obj.IsCustom ? 'Custom' : 'Standard',
                                description: obj.Profile.Description || '-',
                                license: (obj.Profile && obj.Profile.UserLicense) ? obj.Profile.UserLicense.Name : '-',
                                apiNameWithNameSpace: obj.NamespacePrefix ? obj.NamespacePrefix + '__' + obj.Profile?.Name : obj.Profile?.Name,
                            });
                            this.userProfileValue = obj.Id;
                            if (obj.IsCustom == true) {
                                this.isCustomProfile = true;
                            }
                            if (obj.Profile.UserType == 'CsnOnly') {
                                this.csnOnlyUser = true
                            }
                        } else if (obj.Type == 'Group') {
                            this.groupList.push({
                                label: obj.Label,
                                value: obj.Id,
                                apiName: obj.Name,
                                isCustom: obj.IsCustom ? 'Custom' : 'Standard',
                                description: obj.PermissionSetGroup?.Description || '-',
                                license: obj.License?.Name || '-',
                                apiNameWithNameSpace: obj.NamespacePrefix ? obj.NamespacePrefix + '__' + obj.Name : obj.Name,
                            });
                            groupType.push({
                                label: obj.Label,
                                value: obj.Id
                            })
                            this.groupTypeId.push(obj.Id);
                        } else {
                            if (obj.IsCustom == true) {
                                this.permissionSetsList.push(obj);
                            }
                            permissionSetType.push({
                                label: obj.Label,
                                value: obj.Id
                            })
                            this.permissionSetTypeId.push(obj.Id);
                            this.permissionSetList.push({
                                label: obj.Label,
                                value: obj.Id,
                                apiName: obj.Name,
                                isCustom: obj.IsCustom ? 'Custom' : 'Standard',
                                description: obj.Description || '-',
                                license: obj.License?.Name || '-',
                                apiNameWithNameSpace: obj.NamespacePrefix ? obj.NamespacePrefix + '__' + obj.Name : obj.Name,
                            });
                            this.isCustomPermSet[obj.Id] = obj.IsCustom;
                        }
                    })
                    this.userPermissionSetOption = permissionSetType;
                    this.userPermissionSetGroupOption = groupType;
                    this.permIdsToFetchUserPerms = this.permissionSetIdList;
                    this.handleGetObjectHelper(this.permissionSetIdList);
                }
            }).catch(err => {
                console.log('inside err>>', JSON.stringify(err));
            })
    }
    //This Method is used to initiate the user search
    handleUser(event) {
        this.handleUserClear();
        this.isProfile = false;
        if (event.target.value.length > 0) {
            this.allow = true
            this.searchusername = event.target.value;
            this.manageUser(event.target.value);            
        } else {
            this.searchusername = '';
            this.username = [];
            this.isUserObject = false;
            this.allow = false
        }
    }
    //This Method is used to handle user Selection in user tab 
    handleUserClick(event) {
        // Prevent event bubbling
        event.stopPropagation();
        
        // Get data attributes from the clicked element
        const parentId = event.currentTarget.dataset.parentid;
        const name = event.currentTarget.dataset.name;
        const profileId = event.currentTarget.dataset.id;
        
        // Validate data before proceeding
        if (!parentId || !name || !profileId) {
            console.error('Missing required data attributes');
            return;
        }

        this.userNameClick = true;
        this.userId = parentId;
        this.searchusername = name;
        this.userProfileId = profileId;
        this.showSpinner = true;
        this.isUserObject = false;
        this.isPermissionEnabledUser = false;
        
        // Call the wrapper method with validated userId
        this.handleGetUserPermsWrapper(this.userId);
        
        this.selectedObjectType = 'Native';
        this.isSelected = true;
        this.selectedOptionValue = 'All';
        this.isUserNameForPermission = false;
    }
    //This Method is used to get the combined result of object and field Permissions for the users
    handleGetObjectHelper(permissionSetIds) {
        getCombinedObjAndFieldPermsForUser({
                permissionSetIds: permissionSetIds
            })
            .then(result => {
                this.metadataPermissions = result;
                this.objTypeChangeHandler('Native');
            })
            .catch(error => {
                console.log(error);
            })
    }
    //This Method is used to hande the Profile Permissions for the user
    handleProfileUser() {
        this.showSpinner = true;
        this.selectedUserPermissionTypeLabel = ''
        this.isPermissionObj = false;
        this.selectedObjectType = 'Native'
        this.userPermissionSetValue = '';
        this.userPermissionSetGroupValue = '';
        this.permId = this.userProfileValue;
        this.isProfileEdit = true;
        this.isPermissionSetEdit = false;
        this.isPermissionSetGroupEdit = false;
        let selectedUseroption = this.profileList.find(option => option.value === this.permId);
        if (selectedUseroption) {
            this.selecteduserLabel = selectedUseroption.label;
            this.selecteduserApiName = selectedUseroption.apiName;
            this.selecteduserDescription = selectedUseroption.description;
            this.selecteduserLicense = selectedUseroption.license;
            this.selecteduserType = selectedUseroption.isCustom;

        }
        if (this.userProfileValue != '' && this.permId != 'All') {
            this.isPermSetSelected = true
            this.isPermissionSetGroupName = false;
            this.isPermissionSetName = false;
            this.isUserNameForPermission = false;
            this.userNameClick = false
        }
        if (this.permId == 'All') {
            this.userNameClick = true;
            this.isPermSetSelected = false;
        }
        if (this.isCustomProfile == true) {
            this.profileTypeName = '';
        } else {
            this.profileTypeName = 'Standard';
        }
        if (this.csnOnlyUser == true) {
            this.enableObjAndFieldEditAccess = false
            this.enableRecordTypeEdit = false;
        } else {
            this.enableObjAndFieldEditAccess = true;
            this.enableRecordTypeEdit = true;
        }
        this.enableTabSetting = true;
        this.enableDefault = true;
        this.enableMutePermissions = false
        this.enableHelpText = false;
        this.permIdsToFetchUserPerms = this.userProfileValue
        this.handleGetObjectHelper(this.userProfileValue);
    }
    //This Method is used to hande the PermissionSet Permissions for the user
    handleUserPermissionSetChange(event) {
        this.showSpinner = true;
        this.isPermissionObj = false;
        this.selectedObjectType = 'Native'
        this.userPermissionSetGroupValue = '';
        this.selectedUserPermissionSetLabel = event.target.label;
        this.userPermissionSetValue = event.target.value;
        this.permId = this.userPermissionSetValue;
        this.selectedUserPermissionTypeLabel = ''
        this.enableMutePermissions = false;
        this.enableDefault = false;
        if (this.userPermissionSetValue == 'PermAll') {
            this.isProfile = false;
        } else {
            this.isProfile = true;
        }
        this.isProfileEdit = false;
        this.isPermissionSetEdit = true;
        this.isPermissionSetGroupEdit = false;
        let selectedOption = this.userPermissionSetOption.find(option => option.value === this.userPermissionSetValue)
        if (selectedOption) {
            this.selectedUserPermissionTypeLabel = selectedOption.label;
            let selectedUseroption = this.permissionSetList.find(option => option.value === this.userPermissionSetValue);
            if (selectedUseroption) {
                this.selecteduserLabel = selectedUseroption.label;
                this.selecteduserApiName = selectedUseroption.apiName;
                this.selecteduserDescription = selectedUseroption.description;
                this.selecteduserLicense = selectedUseroption.license;
                this.selecteduserType = selectedUseroption.isCustom;
                this.selectedUserApiNameWithNameSpace = selectedUseroption.apiNameWithNameSpace;
                this.handleUserChange(this.permId);
            }
        }
        if (this.selectedUserPermissionTypeLabel != '' && this.permId != 'All') {
            this.isPermSetSelected = false;
            this.isPermissionSetName = true;
            this.isPermissionSetGroupName = false;
            this.isUserNameForPermission = false;
            this.userNameClick = false
        }
        if (this.permId == 'All') {
            this.userNameClick = true;
            this.isPermissionSetName = false;
        }

        if (this.userPermissionSetValue != 'PermAll') {
            if (this.isCustomPermSet[this.userPermissionSetValue] == true) {
                this.enableObjAndFieldEditAccess = true;
                this.enableRecordTypeEdit = true;
            } else {
                this.enableObjAndFieldEditAccess = false;
                this.enableRecordTypeEdit = false;
            }
            this.enableTabSetting = true;            
            this.profileTypeName = '';
            this.enableHelpText = false;
            this.permIdsToFetchUserPerms = this.userPermissionSetValue;
            this.handleGetObjectHelper(this.userPermissionSetValue);
        }
        if (this.userPermissionSetValue == 'PermAll') {
            this.permIdsToFetchUserPerms = this.permissionSetTypeId
            this.handleGetObjectHelper(this.permissionSetTypeId);
            this.enableObjAndFieldEditAccess = false
            this.profileTypeName = '';
            this.enableRecordTypeEdit = false;
            this.enableHelpText = true;
            this.enableTabSetting = false
        }
    }
    //This Method is used to hande the PermissionSetGroup Permissions for the user
    handleUserPermissionSetGroupChange(event) {
        this.showSpinner = true;
        this.isPermissionObj = false;
        this.enableRecordTypeEdit = false;
        this.enableTabSetting = false;
        this.enableObjAndFieldEditAccess = false;
        this.enableDefault = false
        this.profileTypeName = ''
        this.selectedObjectType = 'Native'
        this.userPermissionSetValue = '';
        this.selectedUserPermissionTypeLabel = ''
        this.selectedUserPermissionSetGroupLabel = event.target.label;
        this.userPermissionSetGroupValue = event.target.value;
        this.permId = this.userPermissionSetGroupValue;
        this.permissionSetArrayList.forEach(e => {
            if (e.Id == this.userPermissionSetGroupValue) {
                this.permSetGroupId = e.PermissionSetGroupId;
            }
        })
        this.isProfileEdit = false;
        this.isPermissionSetEdit = false;
        this.isPermissionSetGroupEdit = true;
        if (this.userPermissionSetGroupValue == 'GroupAll') {
            this.isProfile = false;
        } else {
            this.isProfile = true;
        }
        let selectedOption = this.userPermissionSetGroupOption.find(option => option.value === this.userPermissionSetGroupValue)
        if (selectedOption) {
            this.selectedUserPermissionTypeLabel = selectedOption.label;
            let selectedUseroption = this.groupList.find(option => option.value === this.userPermissionSetGroupValue);
            if (selectedUseroption) {
                this.selecteduserLabel = selectedUseroption.label;
                this.selecteduserApiName = selectedUseroption.apiName;
                this.selecteduserDescription = selectedUseroption.description;
                this.selecteduserLicense = selectedUseroption.license;
                this.selecteduserType = selectedUseroption.isCustom;
                this.selectedUserApiNameWithNameSpace = selectedUseroption.apiNameWithNameSpace;
                this.handleUserChange(this.permId);
            }
        }
        if (this.selectedUserPermissionTypeLabel != '' && this.permId != 'All') {
            this.isPermSetSelected = false;
            this.isPermissionSetGroupName = true;
            this.isPermissionSetName = false;
            this.isUserNameForPermission = false;
            this.userNameClick = false
        }
        if (this.permId == 'All') {
            this.userNameClick = true;
            this.isPermissionSetGroupName = false;
        }
        if (this.userPermissionSetGroupValue != 'GroupAll') {
            this.enableMutePermissions = true
            this.enableHelpText = false
            this.handleGetObjectHelper(this.userPermissionSetGroupValue);
            this.permIdsToFetchUserPerms = this.userPermissionSetGroupValue;
        }
        if (this.userPermissionSetGroupValue == 'GroupAll') {
            this.enableMutePermissions = false
            this.enableHelpText = true
            this.permIdsToFetchUserPerms = this.groupTypeId
            this.handleGetObjectHelper(this.groupTypeId);
        }
    }
    //This Method is used to get the FullName for the Selected user Profile.
    handleProfName(profId) {
        getProfileName({
                profileId: profId
            })
            .then(res => {
                this.selecteduserApiName = res[0];
                this.selectedUserApiNameWithNameSpace = res[0];
            })
            .catch(err => {
                console.log(err);
            })
    }
    //This user is used to show user lists
    handleviewUserClick() {
        this.isUsersTable = true;
    }
    //This Method is used to call the server to fetch the selected PermissionType's assigned users
    handleUserChange(profsetid) {
        getAssignedUsersForProfilePerSetPerSetGrp({
                profpersetId: profsetid
            })
            .then((result) => {
                console.log('result', result);
                this.uservalue = result.map(res => {
                    return {
                        Name: res.Assignee?.Name,
                        Username: res.Assignee?.Username,
                        isActive: res.Assignee?.IsActive,
                        licenseName: res.Assignee?.Profile?.UserLicense?.Name
                    };
                });
                this.userValueLength = this.uservalue.length;
            })
            .catch((error) => {
                console.error('Error fetching profile details:', JSON.stringify(error));
            });
    }
    //Used to handle Cancel and revert the changes for respective cancel button
    handleCancel(event) {
        if (event.target.name == 'user cancel') {
            this.isUsersTable = false;
        }
        if (event.target.name == 'edit Cancel') {
            this.isSaveDisabled = true;
            this.isEditClicked = false;
        }
    }
    //This Method is used to edit the Properties of Profile/Permissionset/Group for the users
    handleEditPropClick() {
        if (this.isCustomProfile == false) {
            this.isStandard = true;
        } else {
            this.isStandard = false;
        }
        if (this.isCustomPermSet[this.permId] == false) {
            this.isStandard = true;
        } else {
            this.isStandard = false;
        }
        this.labelValue = this.selecteduserLabel;
        this.apiNameValue = this.selecteduserApiName;
        this.descriptionValue = this.selecteduserDescription;
        this.isEditClicked = true;
    }    
    //This Method is used to handel the input change to edit the Properties of Profile/PermissionSet/Group
    handleInput(event) {
        this.isSaveDisabled = false
        if (event.target.name === 'profile-Label') {
            this.labelValue = event.target.value
        } else if (event.target.name === 'profile-Description') {
            this.descriptionValue = event.target.value;
        } else if (event.target.name === 'permission-set-Label') {
            this.labelValue = event.target.value;
        } else if (event.target.name === 'permission-set-apiName') {
            this.apiNameValue = event.target.value;
        } else if (event.target.name === 'permission-set-Description') {
            this.descriptionValue = event.target.value;
        } else if (event.target.name === 'permission-set-group-Label') {
            this.labelValue = event.target.value;
        } else if (event.target.name === 'permission-set-group-apiName') {
            this.apiNameValue = event.target.value;
        } else if (event.target.name === 'permission-set-group-Description') {
            this.descriptionValue = event.target.value;
        }
    }
    //This Method is used to handle the save for editing Profile/PermissionSet/Group properties
    handleSave() {
        this.showSpinner = true;
        this.isEditClicked = false;

        if (this.isProfileEdit == true) {
            editProfileProperties({
                    profileName: this.selecteduserLabel,
                    newDescription: this.descriptionValue
                })
                .then(res => {
                    console.log('Edited Profile result >>> ', JSON.stringify(res));
                    this.profileList = this.profileList.map(profile => {
                        if (profile.value === this.permId) {
                            profile.description = this.descriptionValue;
                        }
                        return profile;
                    });
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Profile successfully updated',
                            variant: 'success',
                        }),
                    );
                    this.selecteduserLabel = this.labelValue;
                    this.selecteduserDescription = this.descriptionValue;
                    this.showSpinner = false;
                })
                .catch(err => {
                    console.error('Error:', err.body.message);
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
                })
        } else if (this.isPermissionSetEdit == true) {
            editPermSetProperties({
                    perSetId: this.permId,
                    label: this.labelValue,
                    apiName: this.apiNameValue,
                    description: this.descriptionValue
                })
                .then(result => {
                    console.log('Edited perSet result >>> ', JSON.stringify(result));
                    this.permissionSetList = this.permissionSetList.map(perset => {
                        if (perset.value === this.permId) {
                            perset.apiName = this.apiNameValue;
                            perset.label = this.labelValue;
                            perset.description = this.descriptionValue;
                        }
                        return perset;
                    });
                    this.userPermissionSetOption = this.userPermissionSetOption.map(perset => {
                        if (perset.value === this.permId) {
                            perset.label = this.labelValue;
                        }
                        return perset;
                    });
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Permission Set successfully updated',
                            variant: 'success',
                        }),
                    );
                    this.selecteduserApiName = this.apiNameValue;
                    this.selecteduserLabel = this.labelValue;
                    this.selecteduserDescription = this.descriptionValue;
                    this.showSpinner = false;
                })
                .catch(err => {
                    console.error('Error:', err.body.message);
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
                })
        } else if (this.isPermissionSetGroupEdit == true) {
            editPermSetGrpProperties({
                    perSetId: this.permId,
                    label: this.labelValue,
                    apiName: this.apiNameValue,
                    description: this.descriptionValue,
                    format: 'permission set'
                })
                .then(result => {
                    this.showSpinner = false;
                    this.groupList = this.groupList.map(persetgrp => {
                        if (persetgrp.value === this.permId) {
                            persetgrp.apiName = this.apiNameValue;
                            persetgrp.label = this.labelValue;
                            persetgrp.description = this.descriptionValue;
                        }
                        return persetgrp;
                    });
                    this.userPermissionSetGroupOption = this.userPermissionSetGroupOption.map(persetgrp => {
                        if (persetgrp.value === this.permId) {
                            persetgrp.label = this.labelValue;
                        }
                        return persetgrp;
                    });
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Successfully Updated PermissionSetGroup Properties',
                            variant: 'success'
                        })
                    );
                    this.selecteduserApiName = this.apiNameValue;
                    this.selecteduserLabel = this.labelValue;
                    this.selecteduserDescription = this.descriptionValue;
                })
                .catch(err => {
                    console.error('Error:', err.body.message);
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
                })
        }
        this.isSaveDisabled = true;
    }
    //This Method is the custom event called from child to add the Newly created permissionset for user to existing permissionset
    handleNewPermissionSetCreation(event) {
        if (event.detail.IsCustom == true) {
            this.permissionSetsList.push(event.detail);
        }
        this.permissionSetList.push({
            label: event.detail.Label,
            value: event.detail.Id,
            apiName: event.detail.Name,
            isCustom: event.detail.IsCustom ? 'Custom' : 'Standard',
            description: event.detail.Description || '-',
            license: event.detail.License?.Name || '-',
            apiNameWithNameSpace: event.detail.NamespacePrefix ? event.detail.NamespacePrefix + '__' + event.detail.Name : event.detail.Name,
        });
        this.permissionSetTypeId.push(event.detail.Id);
        this.isCustomPermSet[event.detail.Id] = event.detail.IsCustom;
        this.userPermissionSetOption.push({
            label: event.detail.Label,
            value: event.detail.Id
        })
    }
    handlePermsTab(event){
        this.activePermTab = event.target.value; 
       
    }
    handleRefresh(){
        this.showChild = false
        this.selectedObjectType = 'Native'
        console.log('this.activePermTab : ',this.activePermTab);
        this.activePermTab = 'Object'
        this.showSpinner = true;    
        this.isPermissionObj = false; 
        this.handleGetObjectHelper(this.permIdsToFetchUserPerms);
        this.showChild = true
    }

    // Memoized permission filtering
    filterPermissions(permissions, criteria) {
        const cacheKey = `${JSON.stringify(criteria)}`;
        if (this.permissionCache.has(cacheKey)) {
            return this.permissionCache.get(cacheKey);
        }

        const filtered = permissions.filter(perm => 
            this.matchesCriteria(perm, criteria)
        );
        
        this.permissionCache.set(cacheKey, filtered);
        return filtered;
    }

    // Batch processing for large datasets
    processPermissionBatch(permissions, batchSize = 100) {
        let processed = 0;
        const total = permissions.length;

        const processBatch = () => {
            const batch = permissions.slice(processed, processed + batchSize);
            batch.forEach(this.processPermission);
            processed += batch.length;

            if (processed < total) {
                requestAnimationFrame(processBatch);
            }
        };

        requestAnimationFrame(processBatch);
    }

    // Error boundary implementation
    handleError(error) {
        console.error('Permission Analyzer Error:', error);
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: this.extractErrorMessage(error),
                variant: 'error'
            })
        );
        this.resetState();
    }

    // Lifecycle optimization
    disconnectedCallback() {
        this.clearCaches();
        this.unsubscribeFromEvents();
    }

    // Clear caches
    clearCaches() {
        this.searchCache.clear();
        this.permissionCache.clear();
    }

    // Unsubscribe from events
    unsubscribeFromEvents() {
        // Implement any necessary event unsubscription logic here
    }

    // Extract error message
    extractErrorMessage(error) {
        // Implement logic to extract a meaningful error message from the error object
        return 'An error occurred. Please try again later.';
    }

    // Reset state
    resetState() {
        this.handleUserClear();
        this.showSpinner = false;
    }

}