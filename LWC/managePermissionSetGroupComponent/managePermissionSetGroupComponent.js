//This component is used to view users of permission set group,delete permission set group,editing permission set group property & to update user,object,field permissions of permission set group. 
import {LightningElement,track,api,wire} from 'lwc';
import {NavigationMixin} from 'lightning/navigation';
import getPermissionSetGrp from '@salesforce/apex/PermissionSetGroupManager.getPermissionSetGrp';
import getUserPermissionSetGroup from '@salesforce/apex/PermissionSetGroupManager.getUserPermissionSetGroup';
import getProfiles from '@salesforce/apex/PermissionSetGroupManager.getProfiles';
import getPermissionGroup from '@salesforce/apex/PermissionSetGroupManager.getPermissionGroup';
import getPremissionSetGroup from '@salesforce/apex/PermissionSetGroupManager.getPermissionSetGroup';
import deletePerSetGrp from '@salesforce/apex/PermissionSetGroupManager.deletePermissionGroup';
import getPermissionSet from '@salesforce/apex/PermissionSetGroupManager.getPermissionSet';
import insertPermissionSet from '@salesforce/apex/PermissionSetGroupManager.insertPermissionSet';
import deletePermissionSet from '@salesforce/apex/PermissionSetGroupManager.deletePermissionSet';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import getAssignedPermissionSet from '@salesforce/apex/PermissionSetGroupManager.getAssignedPermissionSet';
import editPermissionSetGrp from '@salesforce/apex/PermissionSetGroupManager.editPermissionSetGrp';
import clonePermissionSetGroup from '@salesforce/apex/PermissionSetGroupManager.clonePermissionSetGroup';
import deletePermissionSetGroupWithUnAssignments from '@salesforce/apex/PermissionSetGroupManager.deletePermissionSetGroupWithUnassignments';
import createPermissionSetGroup from '@salesforce/apex/PermissionSetGroupManager.createPermissionSetGroup';
import getCombinedPermissions from '@salesforce/apex/PermissionSetGroupManager.getCombinedPermissions';
import mutePermissions from '@salesforce/apex/PermissionSetGroupManager.mutePermissions';
import getProfileDetails from '@salesforce/apex/PermissionSetGroupManager.getProfileDetails';
import getUnAssignedUserForPermissionSet from '@salesforce/apex/PermissionSetGroupManager.getUnAssignedUserForPermissionSet';
import updateMutePermissions from '@salesforce/apex/PermissionSetGroupManager.updateMutePermissions';
import getSobject from '@salesforce/apex/PermissionSetGroupManager.getSobject';
import getSobjectPermissionsForPermissionSetGroup from '@salesforce/apex/PermissionSetGroupManager.getSobjectPermissionsForPermissionSetGroup';
import checkPermissionSetExists from '@salesforce/apex/PermissionSetGroupManager.checkDuplicatePermissionSetGroup';
import getMutedObjFieldPermissions from '@salesforce/apex/PermissionSetGroupManager.getMutedObjandFieldPermissions';
import getSetPermission from '@salesforce/apex/PermissionSetGroupManager.getSetPermission';
import {refreshApex} from '@salesforce/apex';
import LightningConfirm from 'lightning/confirm';
import { publish, subscribe, unsubscribe, MessageContext } from 'lightning/messageService';
import THEME_CHANNEL from '@salesforce/messageChannel/ThemeChannel__c';

// Add constants for better maintainability
const CONSTANTS = {
    DEBOUNCE_DELAY: 300,
    ERROR_MESSAGES: {
        VALIDATION: 'Please fill in all required fields',
        DUPLICATE: 'Permission Set Group already exists'
    }
};

export default class ManagePermissionSetGroupComponent extends NavigationMixin(LightningElement) {
    // Use private fields for better encapsulation
    #searchTimeout;
    #permissionCache = new Map();

    // Improve state management
    @track state = {
        ui: {
            isLoading: false,
            activeTab: 'permissions',
            showModal: false
        },
        data: {
            permissionSets: [],
            selectedUsers: new Set()
        }
    };

    @track searchPerSetGrpName = '';
    @track searchPerSetName = '';
    @track searchUserVal;
    @track searchPerSetVal = '';
    manageValue = 'Profile';
    @track permissionSetGrps = [];
    @track userData = [];
    @track userPerSetGrp = [];
    profileData = [];
    licenseData = [];
    userLicense = [];
    @track perSetData = [];
    @track filteredData = [];
    @track profileValue = '';
    @track selectedProfile = {};
    @track selectedRowLength = '0';
    actionName;
    @track sortBy;
    @track sortDirection;
    showPerSetAssignTable = false;
    showPerSetTable = false;
    isCreateClicked = false;
    isCreatedNext = false;
    isCreateSave = false;
    isEditClicked = false;
    isCloneClicked = false;
    isDeleteClicked = false;
    isPerSetGrp = false;
    showPerSetGrpTable = false;
    showAssignTable = false;
    showUnAssignTable = false;
    showAssignUsersTable = false;
    isModalAssign = false;
    isModalUnAssign = false;
    isModalViewPerSetGrp = false;
    isModalAssignConfirmMessage = false;
    isModalUnAssignConfirmMessage = false;
    isModalAssignForPerSetConfirmMessage = false;
    isModalUnAssignForPerSetConfirmMessage = false;
    isProfile = false;
    showSpinner = false;
    isAssignPerSet = false;
    showUserPerGrpTable = false;
    @track profileVal = 'All';
    @track profLicenseVal = 'All';
    assigneeId = [];
    assigneeIdForUnAssig = [];
    permissionSetId = [];
    @track clickedRowValue;
    @track clickedPerSetRowValue;
    @track perSetId;
    userNameSpacePrefix;
    userStatus;
    userCreatedBy;
    userModifiedBy;
    perSet = [];
    assignedPerSet = [];
    mutedId;
    @track affectedSobject = [];
    assignedUserLength;
    activeTab = 'PermissionSets';
    isNextDisabled = true;
    @track isAssignDisabled = true;
    @track isUserDisabled = true;
    @track userLabel = '';
    @track userApiName = '';
    @track userDescription = '';
    @track originalUserLabel = '';
    @track originalUserApiName = '';
    @track originalUserDescription = '';
    @track userLabelClone = '';
    @track userApiNameClone = '';
    @track userDescriptionClone = '';
    @track createLabelValue = '';
    @track createApiNameValue = '';
    @track createDescriptionValue = '';
    @track searchTerm = '';
    @track searchKey = '';
    @track searchFieldKey = '';
    isPerSet = false;
    isPermissionSet = false;
    isUser=false;
    isCombinedPermissionForPerSetGrp = false;
    @track systemPer = [];
    @track customObjPer = [];
    @track dataSetObject;
    editInPsg = true;
    befEditPsg = false;
    befEditPsgPer = false;
    isSelectedProfile = false;
    @api updatedOtherRecords;
    @track recordTypeDetails = [];
    showRecTypeForPerSet = false;
    @track combinedPermissions = [];
    @track objectPermissions = [];
    @track objPermissionsMapPsg = {};
    fieldPermissionsMapPsg = [];
    @track psgSystemMap = {};
    @track profileOptionsVal = [];
    @track objList = [];
    disabledUserEdit = true;
    disabledObjEdit = true;
    disabledFieldEdit = true;
    @track lastSavedObject = []
    isField = false
    lastSavedFieldPerm = [];
    @track searchUserPermKey = '';
    @track muteObjPermissions = [];
    @track hasUser = true;
    @track hasObject = true;
    @track hasField = true;
    @track hasPerSet = true;
    @track isSessionChecked = false;
    isUpdateEnabled = true;
    @track tabValue = "User permissions";
    fieldPermissionsCache = {};
    editIcon = false;
    selectedRows = [];
    uniqueLicenses = [];
    @track availablePermissionSets = [];
    @track permissionSetLength = [];
    perSetLength;
    @track selectedPermissionSets = [];
    @track selectedPermissionSetId = [];
    @track selectedPerSetLength = '0';
    @track lastSavedUserPermissions = []
    @track selectedUsersId = [];
    @track clickedLicense;
    @track fieldPermissions = [];
    @track wiredPermissionSetGroups = [];
    hasObjAccess = false;
    @track objectDependencies = [];
    objDepPermissions = {};
    @track objPermissions = {};
    lastSavedObjPerm = {};
    @track muteObjDepPermissions = {};
    muteObjPermCache = {}
    @track selectedIds = new Set();
    @track removedIds = new Set();
    isShowObjectSpinner = false;
    hasEditAccess = false;
    manageOptions = [{
            label: "Profile",
            value: "Profile"
        },
        {
            label: "Permission Set",
            value: "PermissionSet"
        },
        {
            label: "Permission Set Group",
            value: "PermissionSetGroup"
        },
        {
            label: "User",
            value: "User"
        }
    ];

    perSetGrpcolumns = [{
            label: 'Name',
            fieldName: 'DeveloperName',
            sortable: true
        },
        {
            label: 'Label',
            fieldName: 'MasterLabel',
            sortable: true,
        },
        {
            label: 'Description',
            fieldName: 'Description',
            sortable: true,
        },
        {
            label: 'Status',
            fieldName: 'Status',
            sortable: true,
        },
        {
            label: 'NamespacePrefix',
            fieldName: 'NamespacePrefix',
            sortable: true,
        },
        {
            label: 'Created By',
            fieldName: 'CreatedByName',
            sortable: true,
        },
        {
            label: 'Created Date',
            fieldName: 'CreatedDate',
            type: 'date',
            sortable: true,
            typeAttributes: {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            }
        },
        {
            label: 'Last Modified By',
            fieldName: 'lastModifiedByName',
            sortable: true
        },
        {
            label: 'Last Modified Date',
            fieldName: 'LastModifiedDate',
            type: 'date',
            sortable: true,
            typeAttributes: {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            }
        },
        {
            type: 'action',
            typeAttributes: {
                rowActions: (row, doneCallback) => {
                    this.getRowActions(row, doneCallback);
                }
            }
        }
    ];

    perSetColumns = [{
            label: 'Name',
            fieldName: 'Label',
            sortable: true
        },
        {
            label: 'API Name',
            fieldName: 'Name',
            sortable: true
        },
        {
            label: 'Description',
            fieldName: 'Description',
            sortable: true
        },
        {
            label: 'License',
            fieldName: 'license',
            sortable: true
        },
        {
            label: 'Is Custom',
            fieldName: 'IsCustom',
            sortable: true
        },
        {
            label: 'Created By',
            fieldName: 'createdby',
            sortable: true
        },
        {
            label: 'Created Date',
            fieldName: 'CreatedDate',
            type: 'date',
            sortable: true,
            typeAttributes: {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            }
        },
        {
            label: 'Last Modified By',
            fieldName: 'lastmodifiedby',
            sortable: true
        },
        {
            label: 'Last Modified Date',
            fieldName: 'LastModifiedDate',
            type: 'date',
            sortable: true,
            typeAttributes: {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            }
        }
    ]


    userColumns = [{
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
            label: 'Profile',
            fieldName: 'profileName',
            sortable: true
        },
        {
            label: 'Is Active',
            fieldName: 'IsActive',
            sortable: true
        },
        {
            label: 'User License',
            fieldName: 'userLicense',
            sortable: true
        },
    ];

    userPerColumns = [{
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
            label: 'Profile',
            fieldName: 'profileName',
            sortable: true
        },
        {
            label: 'User License',
            fieldName: 'userLicense',
            sortable: true
        },
    ];

    @wire(MessageContext)
    messageContext;

    subscription = null;

    //The wire method fetches data of Permission Set Group
    @wire(getPermissionSetGrp)
    wiredPermissionSetGroups(result) {
        this.wiredPermissionSetGroupsResult = result;
        if (result.data) {
            this.processPermissionSetGroups(result.data);
        } else if (result.error) {
            console.error('Error fetching Permission Set Groups: ', result.error);
        }
    }
    //This Connected Call Back used to retrieve the Profile
    connectedCallback() {
        this.showSpinner = true;
        this.getProfileDetails();
        this.getProfiles();
        
        // Get theme color from localStorage
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

    //This method formats and filters permission set group data based on a search key
    processPermissionSetGroups(data) {
        this.permissionSetGrps = data.map(item => {
            return {
                ...item,
                CreatedByName: item.CreatedByName,
                lastModifiedByName: item.LastModifiedByName,
                MasterLabelLower: item.MasterLabel ? item.MasterLabel.toLowerCase() : ''
            };
        });
        const searchKey = this.searchPerSetGrpName ? this.searchPerSetGrpName.toLowerCase() : '';
        this.filteredData = this.permissionSetGrps.filter(grp =>
            grp.MasterLabelLower.includes(searchKey)
        );
        this.showPerSetGrpTable = this.filteredData.length > 0;
        this.showSpinner = false;
    }

    //This method retrieves permission set groups, processes the data
    fetchPermissionSetGroups() {
        getPermissionSetGrp()
            .then(result => {
                this.processPermissionSetGroups(result);
            })
            .catch(error => {
                console.error('Error fetching Permission Set Groups: ', error);
                this.showSpinner = false;
            });
    }
    //This method used to search Permission Set
    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        this.filteredAvailablePermissionSets;
    }
    //This method filters permission sets based on the searchTerm
    get filteredAvailablePermissionSets() {
        if (this.searchTerm) {
            const filtered = this.perSet.filter(obj => obj.Label.toLowerCase().includes(this.searchTerm.toLowerCase()));
            this.hasPerSet = filtered.length > 0;
            return filtered;
        }
        return this.perSet;
    }
    //This method filters users based on searchUserVal
    get filteredUserData() {
        if (this.searchUserVal) {
            const filtered = this.userData.filter(obj => obj.Name.toLowerCase().includes(this.searchUserVal.toLowerCase()));
            this.showAssignTable = filtered.length > 0;
            return filtered;
        }
        return this.userData;
    }
    //The method returns an icon name based on userStatus
    get statusIcon() {
        if (this.userStatus === 'Failed') {
            return 'utility:error';
        } else if (this.userStatus === 'Updated') {
            return 'utility:check';
        } else {
            return 'utility:info';
        }
    }
    //This method returns a variant style based on userStatus
    get statusVariant() {
        if (this.userStatus === 'Failed') {
            return 'error';
        } else if (this.userStatus === 'Updated') {
            return 'success';
        } else {
            return 'info';
        }
    }
    //This method fetches profile details
    getProfileDetails() {
        getProfileDetails()
            .then((result) => {
                this.showSpinner = false;
                let arrResult = result;
                arrResult.forEach(res => {
                    this.profileOptionsVal.push({
                        label: res.Profile.Name,
                        value: res.ProfileId,
                        detail: {
                            label: res.Profile.Name,
                            licenseName: res.Profile?.UserLicense?.Name,
                            isCustom: res.IsCustom ? 'Custom' : 'Standard',
                            permSetId: res.Id,
                            profileId: res.ProfileId,
                            description: res.Profile.Description,
                            isDelete: res.IsCustom ? true : false,
                            profileType: res.Profile.UserType,
                        }
                    });
                })
                this.isProfile = this.profileOptionsVal.length > 0 ? true : false;

            })
            .catch((error) => {
                console.error('Error fetching profile details:', error);
            });
    }

    perSetHandler() {
        getSetPermission()
            .then(res => {
                if (res.length > 0) {
                    this.perSetData = res;
                    this.showSpinner = false;
                    this.perSetData = res.filter(grp =>
                        grp.Label.toLowerCase().includes(this.searchPerSetName)
                    );
                    if (this.perSetData.length > 0) {
                        this.isPerSet = true
                        this.showPerSetTable = true
                    } else {
                        this.showPerSetTable = false;
                    }
                }
            });
    }

    //This method updates the selected profile
    handleProfileChange(event) {
        this.isSelectedProfile = false;
        this.selectedProfile = {};
        this.profileValue = event.detail.value;
        let selectedOption = this.profileOptionsVal.find(option => option.value === this.profileValue);
        if (selectedOption) {
            this.selectedProfile = selectedOption.detail;
            this.isSelectedProfile = this.selectedProfile ? true : false;
        }
    }

    //This method used to add selected Permission Sets to Permission Set Group
    handleAddPermissionSet() {
        this.selectedIds.forEach(id => {
            console.log('id', id);
            const set = this.perSet.find(set => set.Id === id);

            if (set) {
                this.selectedPermissionSets = [...this.selectedPermissionSets, set];
                this.selectedPerSetLength = this.selectedPermissionSets.length;
                this.isPermissionSet = this.selectedPerSetLength > 0;
                this.selectedPermissionSetId = this.selectedPermissionSets.map(item => item.Id);
                this.perSet = this.perSet.filter(item => item.Id !== id);
                this.selectedIds.delete(id);
            }
        });
        this.permissionSetLength = this.perSet.length;
        this.updateHighlight();
    }
    //This method used to remove selected Permission Sets to Permission Set Group
    handleRemovePermissionSet() {
        this.removedIds.forEach(id => {
            const set = this.selectedPermissionSets.find(set => set.Id === id);
            if (set) {
                this.perSet = [...this.perSet, set];
                this.permissionSetLength = this.perSet.length;
                this.selectedPermissionSets = this.selectedPermissionSets.filter(item => item.Id !== id);
                this.selectedPerSetLength = this.selectedPermissionSets.length;
                this.removedIds.delete(id);
            }
        });
        this.selectedPermissionSetId = this.selectedPermissionSets.map(item => item.Id);
        this.updateHighlight();
    }
    //This method used to reset the selected permission set value
    handleBack() {
        this.selectedIds.clear();
        this.selectedUsersId = [];
        this.selectedPermissionSetId = [];
        this.selectedPermissionSets = [];
        this.isCreateClicked = true;
        this.isCreatedNext = false;
        this.selectedPerSetLength = '0';
    }
    //This method used to filter System Permission based on the search Key
    get filteredSystemPer() {
        if (this.searchUserPermKey) {
            const filtered = this.systemPer.filter(userPerm =>
                userPerm.Label.toLowerCase().includes(this.searchUserPermKey.toLowerCase())
            );
            this.hasUser = filtered.length > 0;
            return filtered;
        }
        return this.systemPer;
    }
    //This method used to filter Object based on the search Key
    get filteredStdObjPer() {
        if (this.searchKey) {
            console.log('inside search : ', this.searchKey);
            const filtered = this.objList.filter(obj => obj.label.toLowerCase().includes(this.searchKey.toLowerCase()));
            this.hasObject = filtered.length > 0;
            return filtered;
        }
        return this.objList;
    }
    //This method used to filter Filed based on the search Key
    get filteredStdFieldPer() {
        if (this.searchFieldKey) {
            console.log('inside search : ', this.searchKey);
            const filtered = this.fieldPermissions.filter(obj => obj.label.toLowerCase().includes(this.searchFieldKey.toLowerCase()));
            this.hasField = filtered.length > 0;
            return filtered;
        }
        return this.fieldPermissions;
    }


    //This method used for search based on object/field/system Permission
    handleSearchKeyChange(event) {
        if (event.target.label == 'Search Objects') {
            this.searchKey = event.target.value;
            this.filteredStdObjPer;
        }
        if (event.target.label == 'Search User Permission') {
            this.searchUserPermKey = event.target.value;
            this.filteredSystemPer;
        }
        if (event.target.label == 'Search Fields') {
            this.searchFieldKey = event.target.value;
            this.filteredStdFieldPer;
        }
    }

    //This method retrieve the Permission Set Length
    get permissionSets() {
        return `Permission Set(${this.perSetLength})`;
    }
    ////This method retrieve the Assigned User Length
    get assignedUsers() {
        return `Assigned Users(${this.assignedUserLength})`;
    }

    //This method defines row-specific actions for a table
    getRowActions(row, doneCallback) {
        console.log('row', JSON.stringify(row))
        const actions = [
            {
                label: 'View Permission set Group',
                name: 'view'
            }
        ];

        doneCallback(actions);
    }

    //This method fetches permission set groups
    permissionSetHandler() {
        getPermissionSetGrp()
            .then(res => {
                this.permissionSetGrps = res.map(item => {
                    return {
                        ...item,
                        CreatedByName: item.CreatedByName,
                        lastModifiedByName: item.LastModifiedByName,
                        MasterLabelLower: item.MasterLabel ? item.MasterLabel.toLowerCase() : ''
                    }
                });
                this.filteredData = res.map(item => {
                    return {
                        ...item,
                        CreatedByName: item.CreatedByName,
                        lastModifiedByName: item.LastModifiedByName
                    }
                });
                this.showSpinner = false;
                const searchTerm = this.searchPerSetGrpName ? this.searchPerSetGrpName.toLowerCase() : '';
                this.filteredData = this.permissionSetGrps.filter(grp =>
                    grp.MasterLabelLower.includes(searchTerm)
                );
                if (this.filteredData.length > 0) {
                    this.isPerSetGrp = true
                    this.showPerSetGrpTable = true
                } else {
                    this.showPerSetGrpTable = false;
                }
            })

    }

    //This method fetches user data related to a permission set group
    permissionSetUserHandler(profName, useLicense, perSetGroupId) {
        getUserPermissionSetGroup({
                profileName: profName,
                userLicense: useLicense,
                perSetGrpId_tofetch: perSetGroupId
            })
            .then(res => {
                this.userData = res.map(item => {
                    return {
                        ...item,
                        profileName: item.Profile?.Name,
                        userLicense: item.Profile?.UserLicense.Name
                    };
                });
                this.showAssignTable = this.userData.length > 0;
                this.showSpinner = false;
            })
            .catch(error => {
                console.error('Error fetching user permission sets', error);
                this.showSpinner = false;
            });
    }

    //This method fetches profile data
    getProfiles() {
        getProfiles()
            .then(result => {
                let allOptionProfile = {
                    label: 'All',
                    value: 'All'
                };
                const sortedProfiles = result.sort((a, b) => a.Name.localeCompare(b.Name));
                this.profileData = [allOptionProfile, ...sortedProfiles.map(item => ({
                    label: item.Name,
                    value: item.Name
                }))];
                let allOptionLicense = {
                    label: 'All',
                    value: 'All'
                };
                let userLicenseSet = new Set();
                sortedProfiles.forEach(item => {
                    const licenseName = item.UserLicense?.Name;
                    if (licenseName) {
                        userLicenseSet.add(licenseName);
                    }
                });
                this.userLicense = [allOptionLicense, ...Array.from(userLicenseSet)
                    .sort((a, b) => a.localeCompare(b))
                    .map(item => ({
                        label: item,
                        value: item
                    }))
                ];
                let noneOptionLicense = {
                    label: 'None',
                    value: 'None'
                };
                let sortedLicenes = result.sort((a, b) => a.Name.localeCompare(b.Name));
                this.licenseData = [noneOptionLicense, ...sortedLicenes.map(item => ({
                    label: item.Name,
                    value: item.Id
                }))]
            })
            .catch(error => {
                console.error('Error fetching profiles:', error);
            });
    }

    //This method fetches permission set data based on the permission set group
    getPermissionSetHandler(permissionSet, searchper) {
        getPermissionSet({
                permissionSetGroupId: permissionSet,
                searchperset: searchper
            })
            .then(res => {
                this.perSet = res.map(per => {
                    return {
                        ...per,
                        license: per.License?.Name || 'No license',
                        createdby: per.CreatedBy?.Name,
                        lastmodifiedby: per.LastModifiedBy?.Name,
                        nameSpacePrefix: per?.NamespacePrefix || 'No NamespacePrefix'
                    };
                });
                this.availablePermissionSets = res;
                this.showPerSetAssignTable = this.perSet.length > 0;
                this.showSpinner = false;
                this.permissionSetLength = this.perSet.length;
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
                this.showSpinner = false;
            });
    }

    //This method retrieves assigned permission sets based on permission set group
    getPermissionSetAssignedHandler(permissionSet) {
        getAssignedPermissionSet({
                permissionSetGroupId: permissionSet
            })
            .then(res => {
                this.assignedPerSet = [];
                this.assignedPerSet = res.map(per => {
                    return {
                        ...per,
                        license: per.License?.Name,
                        createdby: per.CreatedBy?.Name,
                        lastmodifiedby: per.LastModifiedBy?.Name
                    };
                });
                this.perSetLength = res.length;
                const licenses = this.assignedPerSet.map(per => per.license);
                const uniqueLicenses = [...new Set(licenses)];
                if (uniqueLicenses.length > 1) {
                    this.isUserDisabled = true;
                } else {
                    this.isUserDisabled = false;
                }
                if (this.assignedPerSet.length > 0) {
                    this.showPerSetTable = true;
                } else {
                    this.showPerSetTable = false;
                }
                this.showSpinner = false;
            })
            .catch(error => {
                console.error('Error fetching permission sets', error);
                this.showSpinner = false;
            });
    }
    //This method fetches User data based on the Permission Set Group
    permissionSetGroupHandler(permissionsetgroupId) {
        getPremissionSetGroup({
                perSetGrp_Id: permissionsetgroupId
            })
            .then(result => {
                this.userPerSetGrp = [];
                this.userPerSetGrp = result.map(item => {
                    return {
                        ...item,
                        profileName: item.Profile?.Name,
                        userLicense: item.Profile?.UserLicense.Name
                    }
                });
                this.showSpinner = false;
                this.assignedUserLength = this.userPerSetGrp.length;
                if (this.userPerSetGrp.length > 0) {
                    this.showUnAssignTable = true;
                    this.showAssignUsersTable = true;
                } else {
                    this.showUnAssignTable = false;
                    this.showAssignUsersTable = false;
                }
            })
            .catch(error => {
                console.error('Error fetching permission set group', error);
                this.showSpinner = false;
            });
    }

    //This method is used to handle changes based on Profile/Permission Set/Permission Set Group
    handleManageChange(event) {
        this.searchPerSetGrpName = '';
        this.searchPerSetName='';
        this.isPerSetGrp = false;
        this.isPerSet = false;
        this.manageValue = event.target.value;
        console.log('Clicked Value', JSON.stringify(this.manageValue));
        if (event.target.value == 'PermissionSetGroup') {
            this.permissionSetHandler('');
            this.showSpinner = true;
            this.isProfile = false;
            this.isSelectedProfile = false;
            this.profileValue = '';
            this.isUser=false;
            this.fetchPermissionSetGroups();
        }
        if (event.target.value == 'PermissionSet') {
            this.isPerSetGrp = false;
            this.showSpinner = true;
            this.isProfile = false;
            this.isSelectedProfile = false;
            this.profileValue = '';
            this.isUser=false;
            this.isPerSet=true;
        }
        if (event.target.value == 'Profile') {
            this.isPerSetGrp = false;
            this.isProfile = true;
            this.isUser=false;
        }
        if (event.target.value == 'User') {
            this.isProfile = false;
            this.showSpinner=true;
            this.isUser=true;
        }

    }

    // Handle spinner change event from child
     handleSpinnerChange(event) {
        this.showSpinner = event.detail;
    }


    //This method is used to handle the search functionality for filtering permission set groups based on a search key
    handlePerSetGrp(event) {
        this.searchPerSetGrpName = event.target.value;
        this.permissionSetHandler();
    }
    handleSpinnerChange(event) {
        this.showSpinner = event.detail;
    }

    //This method is used to handle the search functionality for filtering users based on a search key
    handlePerSetGrpUser(event) {
        this.searchUserVal = event.target.value;
        this.filteredUserData;
    }
    //This method is used to handle the search functionality for filtering permission set based on a search key
    handlePerSetGrpPerSet(event) {
        this.searchPerSetVal = event.target.value;
        this.getPermissionSetHandler(this.clickedRowValue, this.searchPerSetVal);
    }
    //This method used to handle sorting
    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }
    //This method used for sorting multiple arrays of data based on user/permission set
    sortData(fieldName, sortDirection) {
        let data1 = JSON.parse(JSON.stringify(this.updatedOtherRecords));
        let data2 = JSON.parse(JSON.stringify(this.userData));
        let data3 = JSON.parse(JSON.stringify(this.userPerSetGrp));
        let data4 = JSON.parse(JSON.stringify(this.assignedPerSet));
        let data5 = JSON.parse(JSON.stringify(this.perSet));
        let data6 = JSON.parse(JSON.stringify(this.perSetData));
        let keyValue = (a) => a[fieldName];

        let isReverse = sortDirection === 'asc' ? 1 : -1;

        data1.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : '';
            y = keyValue(y) ? keyValue(y) : '';
            return isReverse * ((x > y) - (y > x));
        });
        data2.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : '';
            y = keyValue(y) ? keyValue(y) : '';
            return isReverse * ((x > y) - (y > x));
        });
        data3.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : '';
            y = keyValue(y) ? keyValue(y) : '';
            return isReverse * ((x > y) - (y > x));
        });
        data4.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : '';
            y = keyValue(y) ? keyValue(y) : '';
            return isReverse * ((x > y) - (y > x));
        });
        data5.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : '';
            y = keyValue(y) ? keyValue(y) : '';
            return isReverse * ((x > y) - (y > x));
        });
        data6.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : '';
            y = keyValue(y) ? keyValue(y) : '';
            return isReverse * ((x > y) - (y > x));
        });
        this.updatedOtherRecords = data1;
        this.userData = data2;
        this.userPerSetGrp = data3;
        this.assignedPerSet = data4;
        this.perSet = data5;
        this.perSetData = data6;
    }
    //This method handles different actions based on the row action selection
    handleRowAction(event) {
        this.selectedRowLength = '0';
        let row = event.detail.row
        this.actionName = event.detail.action.name;
        if (event.detail.action.name == 'assign') {
            this.clickedRowValue = row.perSetGrpId;
            this.clickedLicense = row.userLicense || '';
            this.permissionSetUserHandler(this.profileVal, this.profLicenseVal, this.clickedRowValue);
            this.isAssignDisabled = true;
            this.showSpinner = true;
            this.isModalAssign = true;
        } else if (event.detail.action.name == 'unassign') {
            this.clickedRowValue = row.perSetGrpId;
            this.permissionSetGroupHandler(this.clickedRowValue);
            this.isAssignDisabled = true;
            this.isModalUnAssign = true;
            this.showSpinner = true;
        } else if (event.detail.action.name == 'view') {
            this.activeTab = 'PermissionSets';
            this.clickedPerSetRowValue = row.perSetId;
            this.clickedRowValue = row.perSetGrpId;
            this.getPermissionSetAssignedHandler(this.clickedRowValue);
            this.permissionSetGroupHandler(this.clickedRowValue);
            this.originalUserLabel = row.MasterLabel || '-';
            this.originalUserApiName = row.DeveloperName || '-';
            this.originalUserDescription = row.Description || '-';
            this.userLabel = this.originalUserLabel;
            this.userApiName = this.originalUserApiName;
            this.userDescription = this.originalUserDescription;
            this.userCreatedBy = row.CreatedByName || '-';
            this.userModifiedBy = row.LastModifiedByName || '-';
            this.userNameSpacePrefix = row.NamespacePrefix || '-';
            this.userStatus = row.Status || '-';
            this.searchPerSetVal = '';
            this.perSetId = row.perSetId;
            this.isModalViewPerSetGrp = true;
            this.isAssignDisabled = true;
            this.showSpinner = true;
        }

    }
    //This method used to show the permission set group table
    handleUserClear() {
        if (this.manageValue == 'PermissionSetGroup') {
            this.isPerSetGrp = true
            this.showPerSetGrpTable = true
        }
    }
    //This method used to show the user table
    handleAssignUserClear() {
        this.showAssignTable = true;
        this.searchUserVal = '';
    }

    //This method retrieves unassigned users for permission set
    getUnAssignedUserforPerSet(permissionSetId, profilevalue, userlicensevalue) {
        getUnAssignedUserForPermissionSet({
                permissionSetId: permissionSetId,
                profileName: profilevalue,
                userLicense: userlicensevalue
            })
            .then(res => {
                this.userDataforperserUnassign = res.map(item => {
                    return {
                        ...item,
                        profileName: item.Profile?.Name,
                        userLicense: item.Profile?.UserLicense.Name
                    }
                })
                this.userDataforperserUnassign = this.userDataforperserUnassign.filter(perSet =>
                    perSet.Name.toLowerCase().includes(this.searchUserValforPerSet)
                );
                this.showSpinner = false;
                if (this.userDataforperserUnassign.length > 0) {
                    this.showAssignTableforPerSet = true;
                } else {
                    this.showAssignTableforPerSet = false;
                }
            })
    }

    //This method handles row selection in a user table
    handleRowSelection(event) {
        this.selectedRows = event.detail.selectedRows;
        this.selectedRowLength = this.selectedRows.length;
        this.isAssignDisabled = this.selectedRows.length === 0;
    }
    //This method handles the profile selection
    handleProfile(event) {
        this.profileVal = event.target.value;
        this.permissionSetUserHandler(this.profileVal, this.profLicenseVal, this.clickedRowValue);
        this.getUnAssignedUserforPerSet(this.clickedRowValue, this.profileVal, this.profLicenseVal);
        this.selectedRowLength = '0';
    }

    //This method handles the user license selection
    handleUserLicense(event) {
        this.profLicenseVal = event.target.value;
        this.permissionSetUserHandler(this.profileVal, this.profLicenseVal, this.clickedRowValue);
        this.getUnAssignedUserforPerSet(this.clickedRowValue, this.profileVal, this.profLicenseVal);
    }
    //This method handles various button click actions for Edit/Delete/Clone
    handleClick(event) {
        if (event.target.innerText === 'Edit Property') {
            this.isEditClicked = true;
            this.isModalViewPerSetGrp = false;
            this.permissionSetHandler();
        } else if (event.target.innerText === 'Delete') {
            this.isDeleteClicked = true;
            this.isModalViewPerSetGrp = false;
        } else if (event.target.innerText === 'Clone') {
            this.userLabelClone = this.userLabel + '_clone';
            this.userApiNameClone = this.userApiName + '_clone';
            this.userDescriptionClone = 'This is ' + this.userLabel + ' Clone';
            this.isCloneClicked = true;
            this.isModalViewPerSetGrp = false;
        } else if (event.target.innerText === 'Recalculation') {

        } else {
            this.isCreateClicked = true;
            this.isModalViewPerSetGrp = false;
            this.handleInputCreate(event);
        }
    }

    //This method handles input changes for permission set group Edit
    handleInputChange(event) {
        const field = event.target.dataset.id;
        if (field === 'label') {
            this.userLabel = event.target.value;
            if (this.userLabel) {
            this.userApiName = this.userLabel.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') + '_c';
        } 
        } else if (field === 'apiName') {
            this.userApiName = event.target.value.replace(/[^a-zA-Z0-9_]/g, '');
        } else if (field === 'description') {
            this.userDescription = event.target.value;
        }

    }

    //This method handles input changes for creating permission set group
    handleInputCreate(event) {
        const field = event.target.dataset.id;
        if (field === 'label') {
            this.createLabelValue = event.target.value;
            if (this.createLabelValue) {
                this.createApiNameValue = this.createLabelValue.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') + '_c';
                this.isNextDisabled = false;
            } else {
                this.createApiNameValue = '';
                this.isNextDisabled = true;
            }
        } else if (field === 'apiName') {
            this.createApiNameValue = event.target.value.replace(/[^a-zA-Z0-9_]/g, '');
        } else if (field === 'description') {
            this.createDescriptionValue = event.target.value;
        }
    }

    //This method used to save the Edit of permission set group
    handleSave() {
        this.handleInputChange(event);
        this.showSpinner = true;
        this.isEditClicked = false;
        editPermissionSetGrp({
                perSetId: this.clickedRowValue,
                label: this.userLabel,
                apiName: this.userApiName,
                description: this.userDescription,
                format: 'group'
            })
            .then(result => {
                this.showSpinner = false;
                console.log('Edited perSetGrp result >>> ', JSON.stringify(result));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Permission Set Group successfully updated',
                        variant: 'success',
                    }),

                );
                this.originalUserLabel = this.userLabel;
                this.originalUserApiName = this.userApiName;
                this.originalUserDescription = this.userDescription;
                return refreshApex(this.wiredPermissionSetGroupsResult);
            })
            .catch(err => {
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
                return refreshApex(this.wiredPermissionSetGroupsResult);
            })
        this.isModalViewPerSetGrp = true;

    }


    //This method handles input changes for cloning permission set group
    handleCloneInputChange(event) {
        const field = event.target.dataset.id;
        const value = event.target.value;
        if (field === 'label') {
            this.userLabelClone = value;
            this.userApiNameClone = value.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') + '_c';
        } else if (field === 'apiName') {
            this.userApiNameClone = value.replace(/[^a-zA-Z0-9_]/g, '');
        } else if (field === 'description') {
            this.userDescriptionClone = value;
        }
    }

    //This method used to save the Cloning of permission set group
    handleClone() {
        this.showSpinner = true;
        this.handleCloneInputChange(event);
        this.isCloneClicked = false;
        clonePermissionSetGroup({
                sourcePermissionSetGroupName: this.userLabel,
                newLabel: this.userLabelClone,
                newApiName: this.userApiNameClone,
                newDescription: this.userDescriptionClone
            })
            .then(result => {
                this.showSpinner = true;
                console.log('cloned Result >> ', JSON.stringify(result));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Permission Set Group successfully cloned',
                        variant: 'success',
                    }),
                );
                this.showSpinner = false;
                return refreshApex(this.wiredPermissionSetGroupsResult);
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
                this.isCloneClicked = true;
                this.showSpinner = false;
            })

    }

    //This method used to delete the permission set group
    handleDelete() {
        this.showSpinner = true;
        this.isDeleteClicked = false;
        deletePermissionSetGroupWithUnAssignments({
                permissionSetGroupId: this.clickedRowValue
            })
            .then(result => {
                this.showSpinner = false;
                console.log('cloned Result >> ', JSON.stringify(result));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Permission Set Group successfully deleted',
                        variant: 'success',
                    }),
                );
                return refreshApex(this.wiredPermissionSetGroupsResult);
            })
            .catch(error => {
                console.error('Error:', error.body.message);
                let errorMessage = error.body.message;
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
    //This method used to Create the permission set group
    handleFinish() {
        this.showSpinner = true;
        this.isCreateSave = false;
        this.handleInputCreate(event);

        createPermissionSetGroup({
            label: this.createLabelValue,
            apiName: this.createApiNameValue,
            description: this.createDescriptionValue,
            permissionSetIds: this.selectedPermissionSetId,
            isRequired: this.isSessionChecked
        })
            .then(result => {
                this.showSpinner = false;
                this.resetFormValues();
                this.showSuccessToast('Permission Set Group successfully created');
                return refreshApex(this.wiredPermissionSetGroupsResult);
            })
            .catch(error => {
                this.showSpinner = false;
                this.resetFormValues();
                const errorMessage = this.extractErrorMessage(error.body.message);
                this.showErrorToast(errorMessage);
                return refreshApex(this.wiredPermissionSetGroupsResult);
            })
    }

    resetFormValues() {
        this.createLabelValue = '';
        this.createApiNameValue = '';
        this.createDescriptionValue = '';
        this.selectedIds.clear();
        this.selectedPermissionSetId = [];
        this.selectedPermissionSets = [];
        this.removedIds.clear();
        this.isNextDisabled = true;
        this.isSessionChecked = false;
        this.selectedPerSetLength = '0';
        this.permissionSetLength = [];
    }

    extractErrorMessage(errorMessage) {
        return errorMessage.includes('first error:')
            ? errorMessage.split('first error:')[1].trim()
            : errorMessage;
    }

    showSuccessToast(message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: message,
                variant: 'success'
            })
        );
    }

    showErrorToast(message) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message: message,
                variant: 'error'
            })
        );
    }

    //This method is used to check the existence of a permission set group
    handleNext() {
        checkPermissionSetExists({
                label: this.createLabelValue,
                apiName: this.createApiNameValue
            })
            .then(exists => {
                if (exists) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: 'A Permission Set Group with the same Label or API Name already exists.',
                            variant: 'error'
                        })
                    );
                } else {
                    this.showSpinner = true;
                    this.isCreatedNext = true;
                    this.isCreateClicked = false;
                    this.getPermissionSetHandler('', '');
                }
            })
            .catch(error => {
                console.error('Error:', error.body.message);
                console.error('Error checking Permission Set existence: ', error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Failed to check Permission Set existence. Please try again.',
                        variant: 'error'
                    })
                );
            });
    }
    //This method used for the permission set group creation
    handleclickNext() {
        this.isCreateSave = true;
        this.isCreatedNext = false;
    }
    //This method used for permission set group creation modal
    handleNextCloseModal() {
        this.isCreatedNext = true;
        this.isCreateSave = false;
        this.searchTerm = '';
        this.hasPerSet = true;
    }
    //This method validates session check box of permission set group
    handleSessionChange(event) {
        this.isSessionChecked = event.target.checked;
    }

    //This method for the combined permission modal of permission set group
    handleCombinedPermissionSetGrp() {
        this.isCombinedPermissionForPerSetGrp = true;
        this.isModalViewPerSetGrp = false;
    }
    //This method for various modal cancels
    handleCancel(event) {
        this.showSpinner = false;
        this.isUpdateEnabled = true;
        console.log('OUTPUT : Aria Label', event.target.name);
        if (event.target.name == 'CombinedCancel') {
            this.searchUserPermKey = '';
            this.searchKey = '';
            this.searchFieldKey = '';
            this.disabledObjEdit = true;
            this.disabledFieldEdit = true;
            this.disabledUserEdit = true;
            this.tabValue = 'User permissions';
            this.isCombinedPermissionForPerSetGrp = false;
            this.isModalViewPerSetGrp = true;
        }

        if (event.target.name == 'EditCancel') {
            this.userLabel = this.originalUserLabel;
            this.userApiName = this.originalUserApiName;
            this.userDescription = this.originalUserDescription;
            this.isEditClicked = false;
            this.isModalViewPerSetGrp = true;
        }

        if (event.target.name == 'CloneCanel') {
            this.isCloneClicked = false;
            this.isModalViewPerSetGrp = true;
        }

        if (event.target.name == 'DeleteCancel') {
            this.isDeleteClicked = false;
            this.isModalViewPerSetGrp = true;
        }

        if (this.actionName == 'view') {
            if (event.target.name == 'ViewAssignPersetCancel') {
                this.isModalViewPerSetGrp = false;
                this.selectedRowLength = '0';
            }
            if (event.target.name == 'AssignCancel') {
                this.isModalAssign = false;
                this.profileVal = 'All';
                this.profLicenseVal = 'All';
                this.searchUserVal = '';
                this.isModalViewPerSetGrp = true;
                this.isAssignDisabled = true;
                this.selectedRowLength = '0';
                this.activeTab = 'AssignedUsers';
            }
            if (event.target.name == 'UnassignCancel') {
                this.isModalUnAssign = false;
                this.isModalViewPerSetGrp = true;
            }
            if (event.target.name == 'AssignPersetCancel') {
                this.isAssignPerSet = false;
                this.isModalViewPerSetGrp = true;
                this.searchPerSetVal = '';
                this.isAssignDisabled = true;
                this.selectedRowLength = '0';
            }
            if (event.target.name == 'UnassignConfirmPersetCancel') {
                this.isModalUnAssignForPerSetConfirmMessage = false;
                this.isAssignDisabled = false;
                this.isModalViewPerSetGrp = true;
            }
            if (event.target.name == 'AssignConfirmPersetCancel') {
                this.isModalAssignForPerSetConfirmMessage = false;
                this.isAssignPerSet = true;
                this.isAssignDisabled = false;
            }
            if (event.target.name == 'UnassignConfirmCancel') {
                this.isModalUnAssignConfirmMessage = false;
                this.isModalViewPerSetGrp = true;
                this.isAssignDisabled = false;
            }
            if (event.target.name == 'AssignConfirmCancel') {
                this.isModalAssignConfirmMessage = false;
                this.isModalAssign = true;
                this.isAssignDisabled = false;
            }

        }

        if (this.actionName == 'unassign') {
            if (event.target.name == 'UnassignCancel') {
                this.isModalUnAssign = false;
            }
            if (event.target.name == 'UnassignConfirmCancel') {
                this.isModalUnAssignConfirmMessage = false;
                this.isModalUnAssign = true;
                this.isAssignDisabled = false;
            }
        }

        if (this.actionName == 'assign') {
            if (event.target.name == 'AssignCancel') {
                this.isModalAssign = false;
                this.profileVal = 'All';
                this.profLicenseVal = 'All';
                this.searchUserVal = '';
                this.isAssignDisabled = true;
                this.selectedRowLength = '0';
            }
            if (event.target.name == 'AssignConfirmCancel') {
                this.isModalAssignConfirmMessage = false;
                this.profileVal = 'All';
                this.profLicenseVal = 'All';
                this.permissionSetUserHandler(this.profileVal, this.profLicenseVal, this.clickedRowValue);
                this.getUnAssignedUserforPerSet(this.clickedRowValue, this.profileVal, this.profLicenseVal);
                this.searchUserVal = '';
                this.isModalAssign = true;
                this.isAssignDisabled = false;
            }
        }

        this.editInPsg = true;
    }
    //This method used for closing various modals
    closeModal() {
        this.isCreateClicked = false;
        this.isCreatedNext = false;
        this.isCreateSave = false;
        this.createLabelValue = '';
        this.createApiNameValue = '';
        this.createDescriptionValue = '';
        this.selectedPermissionSets = [];
        this.availablePermissionSets = [];
        this.selectedIds.clear();
        this.isNextDisabled = true;
        this.isSessionChecked = false;
        this.searchTerm = '';
        this.hasPerSet = true;
    }


    //This method handles the assignment of users to a Permission Set Group
    handleAssign() {
        this.isModalAssign = true;
        this.isModalAssignConfirmMessage = true;
        let datatableone = this.template.querySelector('lightning-datatable[data-id="datatableone"]');
        let selectedRowsone = datatableone.getSelectedRows();
        this.assigneeId = selectedRowsone.map(row => row.Id);
        this.isAssignDisabled = false;
    }
    //This method used for assigning users to permission set group
    handleConfirmAssign() {
        this.isModalAssignConfirmMessage = false;
        this.showSpinner = true;
        getPermissionGroup({
                userId: this.assigneeId,
                perGrp_Id: this.clickedRowValue
            })
            .then(result => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'User successfully assigned',
                        variant: 'success',
                    }),
                );
                this.isAssignDisabled = true;
                this.searchUserVal = '';
                this.profileVal = 'All';
                this.profLicenseVal = 'All';
                this.userData = [];
                this.permissionSetUserHandler(this.profileVal, this.profLicenseVal, this.clickedRowValue);
                this.permissionSetGroupHandler(this.clickedRowValue);
                if (this.actionName == 'assign') {
                    this.isModalAssign = true;
                }
                if (this.actionName == 'view') {
                    this.isModalAssign = false;
                    this.isModalViewPerSetGrp = true;

                }
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
                this.isAssignDisabled = true;
                this.isModalAssign = true;
                this.showSpinner = false; // Stop spinner on error
            });
            this.selectedRowLength = '0';
    }

    //This method handles the deleting Permission Set Group
    handleDeletePerSetGrp() {
        let datatabletwo = this.template.querySelector('lightning-datatable[data-id="datatabletwo"]');
        let selectedRowstwo = datatabletwo.getSelectedRows();
        this.assigneeIdForUnAssig = selectedRowstwo.map(row => row.Id);
        if (this.actionName == 'unassign') {
            this.isModalUnAssign = true;
        }
        if (this.actionName == 'view') {
            this.isModalViewPerSetGrp = true;
        }
        this.isModalUnAssignConfirmMessage = true;
        this.isAssignDisabled = false;
    }
    //This method used for deleting permission set group
    handleConfirmUnAssign() {
        this.isModalUnAssignConfirmMessage = false;
        this.showSpinner = true;
        deletePerSetGrp({
                userId: this.assigneeIdForUnAssig,
                delPerGrpId: this.clickedRowValue
            })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'User successfully unassigned',
                        variant: 'success',
                    }),
                );
                this.permissionSetGroupHandler(this.clickedRowValue);
                if (this.actionName == 'view') {
                    this.isModalViewPerSetGrp = true;
                }
                if (this.actionName == 'unassign') {
                    this.isModalUnAssign = true;
                }

                this.isAssignDisabled = true;
                this.showSpinner = false;
            })
            .catch(error => {
                if (this.actionName == 'view') {
                    this.isModalViewPerSetGrp = true;
                }
                if (this.actionName == 'unassign') {
                    this.isModalUnAssign = true;
                }

                this.isAssignDisabled = true;
                this.showSpinner = false;
            });
    }
    //This method used cancel for unassigned users of permission set group
    handleCancelUnAssign() {
        this.isModalUnAssign = false;
        this.isModalViewPerSetGrp = false;
        if (this.actionName == 'view') {
            this.clickedRowValue = '';
            this.getPermissionSetAssignedHandler(this.clickedRowValue);
        }
    }
    //This method handles the user assignment of permission set group
    handleAssignUser() {
        this.isModalViewPerSetGrp = false;
        this.selectedRowLength = '0';
        this.isAssignDisabled = true;
        this.isModalAssign = true;
        this.showSpinner = true;
        this.permissionSetUserHandler(this.profileVal, this.profLicenseVal, this.clickedRowValue);
    }

    //This method used to view the active tab of permission set
    handleviewpertab(event) {
        this.activeTab = event.target.value;
    }
    //This method used to view the active tab of user
    handleviewassigntab(event) {
        this.activeTab = event.target.value;
    }
    //This method handles the permission set of permission set group
    handleAssignPermissionSet() {
        this.isModalViewPerSetGrp = false;
        this.perSet = [];
        this.getPermissionSetHandler(this.clickedRowValue, this.searchPerSetVal);
        this.isAssignDisabled = true;
        this.isAssignPerSet = true;
        this.showSpinner = true;
    }
    //This method handles the assignment for a Permission Set
    handleAssignforPerSet() {
        this.isAssignPerSet = true;
        this.isModalAssignForPerSetConfirmMessage = true;
        let datatablethree = this.template.querySelector('lightning-datatable[data-id="datatablethree"]');
        let selectedRowsthree = datatablethree.getSelectedRows();
        this.permissionSetId = selectedRowsthree.map(row => row.Id);
        this.isAssignDisabled = false;
    }
    //This method handles the assignment of a permission set to a Permission Set Group
    handleConfirmAssignforPerSet() {
        this.showSpinner = true;
        this.isModalAssignForPerSetConfirmMessage = false;
        insertPermissionSet({
                permissionSetId: this.permissionSetId,
                permissionSetGroupId: this.clickedRowValue
            })
            .then(result => {
                console.log('Assignment check ', result);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Permission set successfully assigned',
                        variant: 'success',
                    }),
                );
                this.searchPerSetVal = '';
                this.getPermissionSetAssignedHandler(this.clickedRowValue);
                this.getPermissionSetHandler(this.clickedRowValue, this.searchPerSetVal);
                this.isAssignPerSet = false;
                this.isModalViewPerSetGrp = true;
                this.showSpinner = false;
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
                this.searchPerSetVal = '';
                this.isAssignPerSet = true;
                this.showSpinner = false; // Stop spinner on error
            });
        this.isAssignDisabled = true;
    }
    //This method handles the deletion of a permission set from a Permission Set Group
    handleDeletePermissionSet() {
        this.isModalViewPerSetGrp = true;
        this.isModalUnAssignForPerSetConfirmMessage = true;
        let datatablefour = this.template.querySelector('lightning-datatable[data-id="datatablefour"]');
        let selectedRowsfour = datatablefour.getSelectedRows();
        this.permissionSetId = selectedRowsfour.map(row => row.Id);
        this.isAssignDisabled = false;
    }
    //This method unassigns a permission set from a Permission Set Group
    handleConfirmUnAssignforPerSet() {
        this.isModalUnAssignForPerSetConfirmMessage = false;
        this.showSpinner = true;
        deletePermissionSet({
                permissionSetId: this.permissionSetId,
                delPerSetId: this.clickedRowValue
            })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Permission set successfully unassigned',
                        variant: 'success',
                    }),
                );
                this.getPermissionSetAssignedHandler(this.clickedRowValue);
                this.isAssignDisabled = true;
                this.showSpinner = false;
            })
            .catch(error => {
                this.isAssignDisabled = true;
                this.showSpinner = false;
            });
    }
    //This method retrieves system permission for a Permission Set Group
    getCombinedPermissionsHandler(perSetGrpId, perSetApi, perSetName) {
        getCombinedPermissions({
                permissionSetGroupId: perSetGrpId,
                persetapi: perSetApi,
                persetname: perSetName
            })
            .then(result => {
                this.showSpinner = false;
                this.systemPermissions = JSON.parse(JSON.stringify(result.systemDependencies));
                this.systemPer = result.combinedPermissions.map(info => ({
                    Label: info.fieldLabel,
                    Name: info.fieldName,
                    Value: info.fieldValue,
                    MutedId: info.mutedId ? info.mutedId : '',
                    MutedValue: info.mutedValue,
                    Hasdepend: info.hasDependencies,
                    RequiredPermissions: info.requiredPermissions
                }));
                if (this.systemPer.length > 0) {
                    this.showUserPerGrpTable = true;
                } else {
                    this.showUserPerGrpTable = false;
                }
                this.systemPer.sort((a, b) =>
                    a.Label.toLowerCase().localeCompare(b.Label.toLowerCase())
                );
                this.lastSavedUserPermissions = JSON.parse(JSON.stringify(this.systemPer));
                return this.systemPer;
            })
            .catch(error => {
                this.showSpinner = false;
            });
    }
    //This method retrieves object and permission data based on the permission set
    getSobject(persetid) {
        getSobject({
                permId: persetid
            })
            .then(res => {
                console.log('check res', JSON.stringify(res));
                let entityDef = res['entityDefList'] ? res['entityDefList'] : [];
                this.objDepPermissions = res['objectPermissions'] ? res['objectPermissions'] : {};
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
                })
            })
            .catch(err => {
                this.showSpinner = false;
                throw err;
            })
    }
    //This method retrieves object permissions, field permissions, record type details, and object dependencies 
    getSobjectPermissionsForPermissionSetGroup(permSetId, objName) {
        getSobjectPermissionsForPermissionSetGroup({
                permSetId: permSetId,
                objName: objName
            })
            .then(res => {
                this.isShowObjectSpinner = false;
                this.fieldPermissions = res['fieldPermissions'] ? res['fieldPermissions'] : [];
                console.log('OUTPUT : Field Permissions',JSON.stringify(this.fieldPermissions));
                this.hasObjAccess = res['hasObjAccess'];
                this.objectDependencies = res['objDependent'];
                this.objPermissions = this.objDepPermissions[objName] ? JSON.parse(JSON.stringify(this.objDepPermissions[objName])) : {
                    PermissionsCreate: false,
                    PermissionsEdit: false,
                    PermissionsRead: false,
                    PermissionsDelete: false,
                    PermissionsModifyAllRecords: false,
                    PermissionsViewAllRecords: false
                };
                this.recordTypeDetails = res['recordTypeDetails'] ? res['recordTypeDetails'] : [];

                const uniqueObjects = new Set();
                this.objectDependencies.forEach(({
                    Permission,
                    RequiredPermission
                }) => {
                    const [objName] = Permission.split('<');
                    const [reqObjName] = RequiredPermission.split('<');
                    uniqueObjects.add(objName);
                    uniqueObjects.add(reqObjName);

                })
                const uniqueObjectArray = Array.from(uniqueObjects);
                this.mutePermissionsHelper(permSetId, uniqueObjectArray, objName);
                if (this.recordTypeDetails.length > 0) {
                    this.showRecTypeForPerSet = true
                } else {
                    this.showRecTypeForPerSet = false;
                }
            }).catch(err => {
                this.showSpinner = false;
                throw err;
            })
    }
    //This method used as the helper for the muting permission of permission set group
    mutePermissionsHelper(groupId, objNames, objName) {
        getMutedObjFieldPermissions({
                groupId: groupId,
                objNames: objNames,
                objName: objName
            })
            .then(res => {
                this.mutedId = res.mutePermSetId;
                let wrapperObj = res.wrapper ? res.wrapper : {}
                this.muteObjDepPermissions = {
                    ...wrapperObj.objectPermissions
                };
                this.muteObjPermissions = this.muteObjDepPermissions && this.muteObjDepPermissions[this.dataSetObject] ? JSON.parse(JSON.stringify(this.muteObjDepPermissions[this.dataSetObject])) : {
                    PermissionsCreate: false,
                    PermissionsEdit: false,
                    PermissionsRead: false,
                    PermissionsDelete: false,
                    PermissionsModifyAllRecords: false,
                    PermissionsViewAllRecords: false
                };
                this.muteObjPermCache[this.dataSetObject] = JSON.parse(JSON.stringify(this.muteObjPermissions));
                this.lastSavedObjPerm = JSON.parse(JSON.stringify(this.muteObjPermissions));
                this.fieldPermissions = this.fieldPermissions.map(field => {
                        if (wrapperObj.fieldPermissions[field.Field]) {
                            field.mutedPermissionsRead = wrapperObj.fieldPermissions[field.Field].PermissionsRead;
                            field.mutedPermissionsEdit = wrapperObj.fieldPermissions[field.Field].PermissionsEdit;
                        }
                        return field;
                    })
                    .sort((a, b) => {
                        if (a.label < b.label) {
                            return -1;
                        } else if (a.label > b.label) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                this.isField = this.fieldPermissions.length > 0 ? true : false
                this.fieldPermissionsCache[this.dataSetObject] = JSON.parse(JSON.stringify(this.fieldPermissions));
                this.lastSavedFieldPerm = JSON.parse(JSON.stringify(this.fieldPermissions));
                this.showSpinner = false;
            })
            .catch(err => {
                console.log('err', JSON.stringify(err));
                this.muteObjPermissions = JSON.parse(JSON.stringify(this.lastSavedObjPerm));
                this.fieldPermissions = JSON.parse(JSON.stringify(this.lastSavedFieldPerm));
                this.handleShowToast('Failed to fetch Mute Permission', 'Error', 'error');
                this.showSpinner = false;
            })
    }
    //This method is used for the object permission retrieval of the specific object
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
            this.objPermissions = [];
            this.muteObjPermissions = [];
            this.fieldPermissions = [];
            this.searchFieldKey = '';
            this.disabledObjEdit = true;
            this.disabledFieldEdit = true;
            this.isShowObjectSpinner = true;
            this.isUpdateEnabled = true;
            this.getSobjectPermissionsForPermissionSetGroup(this.clickedRowValue, this.dataSetObject);
        } else {
            this.showSpinner = false;
        }
    }

    //This method handles the muting permission of permission set group
    handleMutePermissionSetGrp(event) {
        this.befEditPsg = true;
        this.editInPsg = false;
        this.befEditPsgPer = true;
        this.disabledUserEdit = false;
        this.disabledObjEdit = false;
        this.disabledFieldEdit = false;
        this.isUpdateEnabled = true;
        this.editIcon = true;
    }

    //This method resets the values of edit in permission set group based on system/object permissions
    handleCancelPSG(event) {
        this.befEditPsg = false;
        this.editInPsg = true;
        this.befEditPsgPer = false;
        this.searchKey = '';
        this.isUpdateEnabled = true;
        if (this.tabValue == 'User permissions') {
            console.log('Inside ---- ');
            this.disabledUserEdit = true;
            this.disabledObjEdit = true;
            this.disabledFieldEdit = true;
            this.psgSystemMap = {};
            this.systemPer = JSON.parse(JSON.stringify(this.lastSavedUserPermissions));
        }
        if (event.target.name === 'cancelEdit' && this.tabValue == 'Object Permissions') {
            this.disabledObjEdit = true;
            this.disabledUserEdit = true;
            this.disabledFieldEdit = true;
            this.editIcon = false;
            this.muteObjPermissions = JSON.parse(JSON.stringify(this.lastSavedObjPerm));
            this.fieldPermissions = JSON.parse(JSON.stringify(this.lastSavedFieldPerm));
        }
    }

    //This method updates the permission settings based on the CRED Permissions
    handlePermissionChange(event) {
        this.isUpdateEnabled = false;
        let {
            name,
            checked
        } = event.target;
        switch (name) {
            case 'create':
                this.muteObjPermissions.PermissionsCreate = checked;
                if (!checked && this.muteObjPermissions.PermissionsRead) {
                    this.muteObjPermissions.PermissionsRead = false;
                }
                break;
            case 'edit':
                this.muteObjPermissions.PermissionsEdit = checked;
                if (!checked && this.muteObjPermissions.PermissionsRead) {
                    this.muteObjPermissions.PermissionsRead = false;
                }
                if (checked) {
                    if (!this.muteObjPermissions.PermissionsDelete) {
                        this.muteObjPermissions.PermissionsDelete = true;
                    }
                    if (!this.muteObjPermissions.PermissionsModifyAllRecords) {
                        this.muteObjPermissions.PermissionsModifyAllRecords = true;
                    }
                }
                break;

            case 'read':
                this.muteObjPermissions.PermissionsRead = checked;
                if (checked) {
                    this.muteObjPermissions.PermissionsCreate = true;
                    this.muteObjPermissions.PermissionsEdit = true;
                    this.muteObjPermissions.PermissionsDelete = true;
                    this.muteObjPermissions.PermissionsViewAllRecords = true;
                    this.muteObjPermissions.PermissionsModifyAllRecords = true;
                }
                break;

            case 'delete':
                this.muteObjPermissions.PermissionsDelete = checked;
                if (!checked) {
                    if (this.muteObjPermissions.PermissionsRead) {
                        this.muteObjPermissions.PermissionsRead = false;
                    }
                    if (this.muteObjPermissions.PermissionsEdit) {
                        this.muteObjPermissions.PermissionsEdit = false;
                    }
                }
                if (checked && !this.muteObjPermissions.PermissionsModifyAllRecords) {
                    this.muteObjPermissions.PermissionsModifyAllRecords = true;
                }
                break;

            case 'viewAllRecords':
                this.muteObjPermissions.PermissionsViewAllRecords = checked;
                if (!checked && this.muteObjPermissions.PermissionsRead) {
                    this.muteObjPermissions.PermissionsRead = false;
                }
                if (checked && !this.muteObjPermissions.PermissionsModifyAllRecords) {
                    this.muteObjPermissions.PermissionsModifyAllRecords = true;
                }
                break;

            case 'modifyAllRecords':
                this.muteObjPermissions.PermissionsModifyAllRecords = checked;
                if (!checked) {
                    if (this.muteObjPermissions.PermissionsRead) {
                        this.muteObjPermissions.PermissionsRead = false;
                    }
                    if (this.muteObjPermissions.PermissionsEdit) {
                        this.muteObjPermissions.PermissionsEdit = false;
                    }
                    if (this.muteObjPermissions.PermissionsDelete) {
                        this.muteObjPermissions.PermissionsDelete = false;
                    }
                    if (this.muteObjPermissions.PermissionsViewAllRecords) {
                        this.muteObjPermissions.PermissionsViewAllRecords = false;
                    }
                }
                break;

            default:
                console.log('Unknown permission');
        }
        this.objPermissionsMapPsg[this.dataSetObject] = {
            ...this.muteObjPermissions
        };
        if (this.objectDependencies.length > 0) {
            this.handleDependencies(name, checked);
        }
    }
    //This method used to retrieve the dependency based on CRED Permissions
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
        console.log('Initial this.muteObjDepPermissions:', JSON.stringify(this.muteObjDepPermissions));
        let objDependentPerm = JSON.parse(JSON.stringify(this.muteObjDepPermissions));

        const affectedPermissions = [];
        let processedObjects = {}

        try {
            this.objectDependencies.forEach(({
                Permission,
                RequiredPermission
            }) => {
                const [objName, permType] = Permission.split('<');
                const [reqObjName, reqPermType] = RequiredPermission.split('<');

                const checkAndMutePermissions = (objectName, permissionType, isChecked) => {
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
                        if (!this.muteObjDepPermissions[objectName] || !this.muteObjDepPermissions[objectName][valueKey]) {
                            this.objPermissionsMapPsg[objectName] = objDependentPerm[objectName];
                        }
                    }
                    this.objectDependencies.forEach(dep => {
                        if (dep.RequiredPermission === `${objectName}<${permissionType}>`) {
                            const [childObjName] = dep.Permission.split('<');
                            if (relatedPermissionsUncheckMap[permissionType]) {
                                relatedPermissionsUncheckMap[permissionType].forEach(relatedPerm => {
                                    checkAndMutePermissions(childObjName, relatedPerm, isChecked);
                                })
                            }
                        }
                    })

                }
                const unCheckRevertingMutePermissions = (requiredObjectName, objectName, relatedPerm) => {
                    const valueKey = `Permissions${relatedPerm.charAt(0).toUpperCase() + relatedPerm.slice(1)}`;
                    const depPermissionValue = this.muteObjDepPermissions[objectName] ? {
                        ...this.muteObjDepPermissions[objectName]
                    } : {
                        PermissionsRead: false,
                        PermissionsCreate: false,
                        PermissionsEdit: false,
                        PermissionsDelete: false,
                        PermissionsViewAllRecords: false,
                        PermissionsModifyAllRecords: false
                    };
                    const reqPermission = this.muteObjDepPermissions[requiredObjectName] ? JSON.parse(JSON.stringify(this.muteObjDepPermissions[requiredObjectName])) : {
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
                    if (this.objPermissionsMapPsg[requiredObjectName][valueKey] === reqPermission[valueKey]) {
                        this.objPermissionsMapPsg[objectName] = processedObjects[objectName];
                    } else {
                        this.objPermissionsMapPsg[objectName][valueKey] = this.objPermissionsMapPsg[requiredObjectName][valueKey];
                        if (this.objPermissionsMapPsg[objectName][valueKey]) {
                            relatedPermissionsUncheckMap[relatedPerm].forEach(depPerm => {
                                const depValueKey = `Permissions${depPerm.charAt(0).toUpperCase() + depPerm.slice(1)}`;
                                this.objPermissionsMapPsg[objectName][depValueKey] = true;
                                processedObjects[objectName][depValueKey] = this.objPermissionsMapPsg[objectName][depValueKey]
                            })
                        }
                    }
                    this.objectDependencies.forEach(dep => {
                        if (dep.RequiredPermission === `${objectName}<${relatedPerm}>`) {
                            const [childObjName] = dep.Permission.split('<');
                            if (this.objPermissionsMapPsg[childObjName]) {
                                unCheckRevertingMutePermissions(objectName, childObjName, relatedPerm);
                            }
                        }
                    })
                }
                const uncheckAndUnmutePermissions = (objectName, permissionType) => {
                    const valueKey = `Permissions${permissionType.charAt(0).toUpperCase() + permissionType.slice(1)}`;
                    if (objDependentPerm[objectName] && objDependentPerm[objectName][valueKey]) {
                        objDependentPerm[objectName][valueKey] = false;
                        affectedPermissions.push(`${objectName}.${valueKey}`);
                        this.objPermissionsMapPsg[objectName] = objDependentPerm[objectName];
                        this.objectDependencies.forEach(dep => {
                            if (dep.Permission === `${objectName}<${permissionType}>`) {
                                const [parentObjName, parentPermType] = dep.RequiredPermission.split('<');
                                // Recursively uncheck child permissions based on relatedPermissionsUncheckMap
                                relatedPermissionsCheckMap[permissionType].forEach(relatedPerm => {
                                    uncheckAndUnmutePermissions(parentObjName, permissionType);
                                });
                            }
                        });
                    }
                }
                const checkRevertingMutePermissions = (objectName, requiredObjectName, relatedPerm) => {
                    const depPermissionValue = this.muteObjDepPermissions[requiredObjectName] ? this.muteObjDepPermissions[requiredObjectName] : {
                        PermissionsRead: false,
                        PermissionsCreate: false,
                        PermissionsEdit: false,
                        PermissionsDelete: false,
                        PermissionsViewAllRecords: false,
                        PermissionsModifyAllRecords: false
                    };
                    const reqPermission = this.muteObjDepPermissions[objectName] ? JSON.parse(JSON.stringify(this.muteObjDepPermissions[objectName])) : {
                        PermissionsRead: false,
                        PermissionsCreate: false,
                        PermissionsEdit: false,
                        PermissionsDelete: false,
                        PermissionsViewAllRecords: false,
                        PermissionsModifyAllRecords: false
                    };
                    const valueKey = `Permissions${relatedPerm.charAt(0).toUpperCase() + relatedPerm.slice(1)}`;
                    if (this.objPermissionsMapPsg[objectName][valueKey] === reqPermission[valueKey]) {
                        this.objPermissionsMapPsg[requiredObjectName][valueKey] = depPermissionValue[valueKey];
                    }
                    this.objectDependencies.forEach(dep => {
                        if (dep.Permission === `${requiredObjectName}<${relatedPerm}>`) {
                            const [parentObjName] = dep.RequiredPermission.split('<');
                            if (this.objPermissionsMapPsg[parentObjName]) {
                                checkRevertingMutePermissions(requiredObjectName, parentObjName, relatedPerm);
                            }
                        }
                    })
                }
                if (isChecked && reqObjName === this.dataSetObject) {
                    if (RequiredPermission.includes(`${reqObjName}<${changedPermission}>`)) {
                        if (relatedPermissionsUncheckMap[changedPermission]) {
                            relatedPermissionsUncheckMap[changedPermission].forEach(relatedPerm => {
                                checkAndMutePermissions(objName, relatedPerm, isChecked);
                            })
                        }
                    }
                }
                if (!isChecked && reqObjName === this.dataSetObject && this.objPermissionsMapPsg[objName]) {
                    allRelatedPerm.forEach(relatedPerm => {
                        if (RequiredPermission.includes(`${reqObjName}<${relatedPerm}>`)) {
                            unCheckRevertingMutePermissions(reqObjName, objName, relatedPerm)
                        }
                    })
                }
                if (!isChecked && objName === this.dataSetObject) {
                    if (relatedPermissionsCheckMap[changedPermission]) {
                        relatedPermissionsCheckMap[changedPermission].forEach(relatedPerm => {
                            if (Permission.includes(`${objName}<${relatedPerm}>`)) {
                                uncheckAndUnmutePermissions(reqObjName, relatedPerm);
                            }
                        });
                    }
                }
                if (isChecked && objName === this.dataSetObject && this.objPermissionsMapPsg[reqObjName]) {
                    console.log('inside sub check : ');
                    allRelatedPerm.forEach(relatedPerm => {
                        if (Permission.includes(`${objName}<${relatedPerm}>`)) {
                            checkRevertingMutePermissions(objName, reqObjName, relatedPerm)
                        }
                    })
                }
            })

        } catch (error) {
            console.error('Error in handleMuteDependencies:', error.message || error, error.stack || '');
        }
    }

    //This method used to handle changes of field permissions
    handleFieldPermChange(event) {
        this.isUpdateEnabled = false;
        this.fieldPermissions = this.fieldPermissions.map(field => {
            if (field.Field === event.target.dataset.name) {
                field[event.target.name] = event.target.checked;
                if (event.target.name == 'mutedPermissionsRead' && event.target.checked) {
                    field.mutedPermissionsEdit = true;
                }
                if (event.target.name === 'mutedPermissionsEdit' && !event.target.checked) {
                    field.mutedPermissionsRead = false;
                }
                if (event.target.name === 'mutedPermissionsEdit' && event.target.checked) {
                    field.mutedPermissionsRead = false;
                }
                if (!this.fieldPermissionsMapPsg.includes(field)) {
                    this.fieldPermissionsMapPsg.push(field);
                }
            }
            return field;
        });
    }
    //This method handles the change of system permissions for permission set group
    handlesystemPermissionChangepsg(event) {
         this.isUpdateEnabled = false;
        const objectId = event.target.dataset.id;
        const fieldApi = event.target.dataset.fieldapi.replace('Permissions', '');
        const isChecked = event.target.checked;

        try {
            if (isChecked) {
                this.checkPermissionDependenciesMute(fieldApi, objectId);
            } else {
                this.uncheckPermissionDependenciesMute(fieldApi, objectId);
            }
        } catch (error) {
            console.error('Error in handlesystemPermissionChangeps:', error.message || error, error.stack || '');
        }

        this.systemPer = this.systemPer.map(user => {
            Object.keys(this.psgSystemMap).forEach(key => {
                let permissionKey = "Permissions" + key;
                if (user.Name === permissionKey) {
                    user.fieldValue = this.psgSystemMap[key];
                }
            });
            return user;
        });

        // Initialize nested structure for objectId if not already present
        if (!this.psgSystemMap[objectId]) {
            this.psgSystemMap[objectId] = {};
        }
        this.psgSystemMap[objectId][`Permissions${fieldApi}`] = isChecked;

        console.log('Updated SystemMap:', JSON.stringify(this.psgSystemMap));
    }
    
    // This method is used to maintain User to User Permission Dependencies to grant parent access if child access is granted
checkPermissionDependenciesMute(fieldName, objectId) {
    console.log('checkPermissionDependenciesMute : ', fieldName);
    this.systemPermissions.forEach(({ Permission, RequiredPermission }) => {
        if (RequiredPermission === fieldName) {
            const dependentField = 'Permissions' + Permission;
            const dependentUserPermission = this.systemPer.find(obj => obj.Name === dependentField);

            if (dependentUserPermission && !dependentUserPermission.Value) {
                // Ensure nested structure for objectId exists
                if (!this.psgSystemMap[objectId]) {
                    this.psgSystemMap[objectId] = {};
                }
                this.psgSystemMap[objectId][`Permissions${Permission}`] = true;

                // Recursively check dependencies with objectId
                this.checkPermissionDependenciesMute(Permission, objectId);
            }
        }
    });
}

// This method is used to maintain User to User Permission Dependencies to remove child access if parent access is removed
uncheckPermissionDependenciesMute(fieldName, objectId) {
    this.systemPermissions.forEach(({ Permission, RequiredPermission }) => {
        if (Permission === fieldName) {
            const reqField = 'Permissions' + RequiredPermission;
            const reqPermission = this.systemPer.find(obj => obj.Name === reqField);

            if (reqPermission && reqPermission.Value) {
                // Ensure nested structure for objectId exists
                if (!this.psgSystemMap[objectId]) {
                    this.psgSystemMap[objectId] = {};
                }
                this.psgSystemMap[objectId][`Permissions${RequiredPermission}`] = false;

                // Recursively uncheck dependencies with objectId
                this.uncheckPermissionDependenciesMute(RequiredPermission, objectId);
            }
        }
    });
}
    //This method used to update the system permission of permission set group
    async handleUpdateSystempsg() {
        if (this.tabValue == 'User permissions') {
            this.showSpinner = true;
            let systemPermissionsMapJson = JSON.stringify(this.psgSystemMap);
            if (systemPermissionsMapJson && systemPermissionsMapJson !== '{}') {
                mutePermissions({
                        systemPermissionsMapJson: systemPermissionsMapJson,
                        psgname: this.userLabel,
                        psgapiname: this.userApiName,
                        psgid: this.clickedRowValue
                    })
                    .then(res => {
                        res.forEach(updatedItem => {
                            Object.keys(updatedItem).forEach((key) => {
                                console.log('Inside key : ');
                                let lowercaseKey = key.toLowerCase();
                                this.systemPer = this.systemPer.map(userPerm => {
                                    if (userPerm.Name == lowercaseKey) {
                                        userPerm.Value = updatedItem[key];
                                    }
                                    return userPerm
                                })

                            })

                        })
                        this.lastSavedUserPermissions = JSON.parse(JSON.stringify(this.systemPer));
                        this.showUserPerGrpTable = true;
                        this.disabledUserEdit = true;
                        this.disabledObjEdit = true;
                        this.disabledFieldEdit = true;
                        this.editInPsg = true;
                        this.befEditPsg = false;
                        this.showSpinner = false;
                        this.psgSystemMap = {};
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'user permission updated successfully',
                                variant: 'Success'
                            })
                        );
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
                        this.systemPer = JSON.parse(JSON.stringify(this.lastSavedUserPermissions));
                        this.showSpinner = false;
                        this.showUserPerGrpTable = true;
                        this.editInPsg = true;
                        this.befEditPsg = false;
                        this.psgSystemMap = {};
                        this.disabledUserEdit = true;
                    });

            }
        }
        if (this.tabValue == 'Object Permissions') {
            const permissionsMapJson = JSON.stringify(this.objPermissionsMapPsg);
            console.log('OBJECT OUTPUT : ', permissionsMapJson);
            const permissionsMapfieldJson = JSON.stringify(this.fieldPermissionsMapPsg);
            console.log('FIELD OUTPUT : ', permissionsMapfieldJson);
            if (this.objPermissionsMapPsg == null || this.objPermissionsMapPsg == undefined) {
                this.objPermissionsMapPsg = {};
            }
            if (this.fieldPermissionsMapPsg == null || this.fieldPermissionsMapPsg == undefined) {
                this.fieldPermissionsMapPsg = [];
            }
            for (let key in this.objPermissionsMapPsg) {
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
                    this.muteObjHandler(this.mutedId, this.clickedRowValue, this.dataSetObject, this.objPermissionsMapPsg, this.fieldPermissionsMapPsg)
                } else {
                    this.combinedPermissions = JSON.parse(JSON.stringify(this.lastSavedObjPerm));
                    this.fieldPermissions = JSON.parse(JSON.stringify(this.lastSavedFieldPerm));
                    this.disabledObjEdit = true;
                    this.disabledFieldEdit = true;
                    this.editInPsg = true;
                    this.fieldPermissionsMapPsg = [];
                    this.objPermissionsMapPsg = {}
                    this.affectedSobject = []
                    this.isUpdateEnabled = true
                    this.editIcon = false;
                }
            } else {
                this.muteObjHandler(this.mutedId, this.clickedRowValue, this.dataSetObject, this.objPermissionsMapPsg, this.fieldPermissionsMapPsg)

            }

        }

    }
    //This method used as the helper method for the object permission update of permission set group
    muteObjHandler(mutedPermId, permSetId, objName, objPermission, fieldPermissionWrapperList) {
        this.showSpinner = true;
        updateMutePermissions({
                mutePermId: mutedPermId,
                permSetId: permSetId,
                objName: objName,
                objPermission: objPermission,
                fieldPermissionWrapperList: fieldPermissionWrapperList
            })
            .then(res => {
                this.showSpinner = false;
                this.fieldPermissionsMapPsg = [];
                this.objPermissionsMapPsg = {}
                this.affectedSobject = []
                this.isUpdateEnabled = true;
                this.disabledObjEdit = true;
                this.disabledFieldEdit = true;
                this.editInPsg = true;
                this.editIcon = false;
                if (res.objectPermissions != null && res.objectPermissions != undefined) {
                    if (res.objectPermissions[this.dataSetObject]) {
                        this.combinedPermissions = {
                            ...res.objectPermissions[this.dataSetObject]
                        }
                    }
                    Object.keys(res.objectPermissions).forEach((key) => {
                        this.muteObjPermCache[key] = res.objectPermissions[key];
                    })
                }
                this.lastSavedObject = JSON.parse(JSON.stringify(this.combinedPermissions));
                if (res.fieldPermissions) {
                    this.fieldPermissions = this.fieldPermissions.map(field => {
                        let updatedField = res.fieldPermissions.find(updated => updated.Field === field.Field);
                        return updatedField ? updatedField : field;
                    });
                    this.lastSavedFieldPerm = JSON.parse(JSON.stringify(this.fieldPermissions));
                    this.fieldPermissionsCache[this.dataSetObject] = JSON.parse(JSON.stringify(this.fieldPermissions));
                }
                this.handleShowToast('Muted Permissions Successfully', 'Success', 'success');
            })
            .catch(err => {
                let errorMessage = err.body.message;
                let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                this.showSpinner = false;
                this.combinedPermissions = JSON.parse(JSON.stringify(this.lastSavedObjPerm));
                this.fieldPermissions = JSON.parse(JSON.stringify(this.lastSavedFieldPerm));
                this.disabledObjEdit = true;
                this.disabledFieldEdit = true;
                this.editInPsg = true;
                this.fieldPermissionsMapPsg = [];
                this.objPermissionsMapPsg = {}
                this.affectedSobject = []
                this.isUpdateEnabled = true
                this.editIcon = false;
                this.handleShowToast(extractedMessage, 'Error', 'error');
            })
    }
    //This method used for the pagination
    updateHandler(event) {
        if (event.detail.slicedRecords != undefined && event.detail.slicedRecords.length > 0) {
            this.updatedOtherRecords = [...event.detail.slicedRecords];
        }
    }
    //This method handles the system/object/field permission tab of the permission set group
    handleTabValue(event) {
        this.tabValue = event.target.value;
        this.showSpinner = true;
        this.isUpdateEnabled = true;
        if (this.tabValue == 'User permissions') {
            if (this.hasUser == false) {
                this.hasUser = true;
            }
            this.objList = [];
            this.editInPsg = true;
            this.disabledUserEdit = true;
            this.getCombinedPermissionsHandler(this.clickedRowValue, this.userApiName, this.userLabel);
            this.searchFieldKey = '';
            this.searchKey = '';
        }
        if (this.tabValue == 'Object Permissions') {
            if (this.hasObject == false || this.hasField == false) {
                this.hasObject = true;
                this.hasField = true
            }
            this.systemPer = [];
            this.editInPsg = true;
            this.disabledObjEdit = true;
            this.disabledFieldEdit = true;
            this.searchUserPermKey = '';
            this.getSobject(this.clickedRowValue);
        }
    }
    //This method used to add the selected permission set
    handleAddClickValue(event) {
        const id = event.currentTarget.dataset.id;
        console.log('Id', id);
        if (this.selectedIds.has(id)) {
            this.selectedIds.delete(id);
        } else {
            this.selectedIds.add(id);
        }
        this.updateHighlight();
    }
    //This method used to remove the selected permission set
    handleRemoveClickValue(event) {
        const id = event.currentTarget.dataset.id;
        console.log('Id', id);
        if (this.removedIds.has(id)) {
            this.removedIds.delete(id);
        } else {
            this.removedIds.add(id);
        }
        this.updateHighlight();
    }
    //This method used as the styling for the adding/removing permission set group
    updateHighlight() {
        this.template.querySelectorAll('.slds-grid').forEach(item => {
            item.classList.remove('selected-user');
        });
        this.selectedIds.forEach(selectedId => {
            const selectedItem = this.template.querySelector(`[data-id="${selectedId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected-user');
            }
        });
        this.removedIds.forEach(removedId => {
            const removedItem = this.template.querySelector(`[data-id="${removedId}"]`);
            if (removedItem) {
                removedItem.classList.add('selected-user');
            }
        });

    }
    //This event is to update the cloned detail to excisting profile list
    handleProfileCloneCustomEvent(){
        location.reload();
    }
    //This method dispatches a toast notification with the given message, title, and variant
    handleShowToast(message, title, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant,
                mode: "dismissible"
            })
        );
    }

    // Add proper error boundaries
    errorCallback(error, stack) {
        this.handleError(error);
        return true;
    }

    // Add debouncing for search
    handleSearch(event) {
        clearTimeout(this.#searchTimeout);
        this.#searchTimeout = setTimeout(() => {
            this.performSearch(event.target.value);
        }, CONSTANTS.DEBOUNCE_DELAY);
    }

    // Add proper validation
    validateForm() {
        const inputs = this.template.querySelectorAll('lightning-input');
        return [...inputs].every(input => {
            const isValid = input.reportValidity();
            if (!isValid) {
                input.showHelpMessageIfInvalid();
            }
            return isValid;
        });
    }

    // Improve error handling
    handleError(error) {
        const message = this.getErrorMessage(error);
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error',
                message,
                variant: 'error'
            })
        );
    }
}