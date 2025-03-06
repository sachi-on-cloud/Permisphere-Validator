//This component is used to create,edit,delete,assign users,unassign users,update user/object/field/recordtype/Tab permissions for Permission Set.
//This Component is used as child Component under ManagePermissionSetGroupComponent.
import {LightningElement,track,api,wire} from 'lwc';
import getSetPermission from '@salesforce/apex/PermissionSetManager.getSetPermission';
import getUnAssignedUserForPermissionSet from '@salesforce/apex/PermissionSetManager.getUnAssignedUserForPermissionSet';
import getAssignedUserForPermissionSet from '@salesforce/apex/PermissionSetManager.getAssignedUserForPermissionSet';
import insertUsertoPermissionSet from '@salesforce/apex/PermissionSetManager.insertUsertoPermissionSet';
import deleteUserfromPermissionSet from '@salesforce/apex/PermissionSetManager.deleteUserfromPermissionSet';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import editPermissionSet from '@salesforce/apex/PermissionSetManager.editPermissionSet';
import deletePerSet from '@salesforce/apex/PermissionSetManager.deletePerSet';
import clonePermissionSetwithUsers from '@salesforce/apex/PermissionSetManager.clonePermissionSetwithUsers';
import clonePermissionSetWithoutUser from '@salesforce/apex/PermissionSetManager.clonePermissionSetWithoutUser';
import createPermissionSet from '@salesforce/apex/PermissionSetManager.createPermissionSet';
import getPermissionSetLicenseCreate from '@salesforce/apex/PermissionSetManager.getPermissionSetLicenseCreate';
import getUserforPermissionSet from '@salesforce/apex/PermissionSetManager.getUserForPermissionSet';
import updateSystemPermissions from '@salesforce/apex/PermissionSetManager.updateSystemPermissions';
import getProfiles from '@salesforce/apex/PermissionSetManager.getProfiles';
import getUserPermissionSetGroup from '@salesforce/apex/PermissionSetGroupManager.getUserPermissionSetGroup';
import updatetab from '@salesforce/apex/TabPermissionAnalyzerServer.updatePermissionSetTabVisibilities';
import getPermissionSetTabSetting from '@salesforce/apex/PermissionSetManager.getPermissionSetTabSetting';
import checkPermissionSetExists from '@salesforce/apex/PermissionSetManager.checkDuplicatePermissionSet';
import updateSobjectMeta from '@salesforce/apex/PermissionAnalyzerObjectServer.updateObjPermissions';
import getCombinedPermissionsforProfile from '@salesforce/apex/PermissionSetManager.getCombinedPermissionsforProfile';
import getProfileObjectDetails from '@salesforce/apex/ProfileManager.getProfileObjectDetails';
import getSobjectPermissionsForPermissionSet from '@salesforce/apex/PermissionSetManager.getSobjectPermissionsForPermissionSet';
import LightningConfirm from 'lightning/confirm';
import {refreshApex} from '@salesforce/apex';

// Add constants for better maintainability
const CONSTANTS = {
    DEBOUNCE_DELAY: 300,
    ERROR_MESSAGES: {
        DUPLICATE: 'A Permission Set with the same Label or API Name already exists.',
        VALIDATION: 'Please fill in all required fields.'
    },
    REGEX: {
        API_NAME: /^[a-zA-Z][a-zA-Z0-9_]*$/,
        LABEL: /[^a-zA-Z0-9\s]/g
    }
};

export default class ManagePermissionSetComponent extends LightningElement {
    @track searchPerSetName = '';
    @track searchUserValforPerSet = '';
    @track userData = [];
    @track userDataforPerSet = [];
    @track userDataforperserUnassign = [];
    @track profileData = [];
    licenseData = [];
    combinedLicenseValue = [];
    userLicense = [];
    iconName;
    variant;
    @track profileValue = '';
    @track dataSetObject = ''
    @track selectedRowLengthforPerSet = '0';
    actionPerSetName;
    @track sortBy;
    @track sortDirection;
    editInPsg = true;
    isCreatePerSetClicked = false;
    isCreatedNext = false;
    isCreatedNextforPermissionSet = false;
    isCreateSave = false;
    isCreateSaveforPermissionSet = false;
    isEditClickedforPermissionSet = false;
    isCloneClickedforPermissionSet = false;
    isCloneClickedforPermissionSetusers = false;
    isdeleteClickedforPermissionSet = false;
    isPerSetGrp = false;
    showPerSetGrpTable = false;
    showAssignTable = false;
    showAssignTableforPerSet = false;
    showUnAssignTableforPerSet = false;
    showUnAssignTableforPerSetforView = false;
    showPerSetTable;
    isModalForPerSetAssign = false;
    isModalForPerSetUnAssign = false;
    isModalViewPerSet = false;
    isModalAssignConfirmMessageforPerSet = false
    editIcon = false;
    isModalUnAssignConfirmMessageforPermissionSet = false;
    disabledObjEdit = true;
    disabledFieldEdit = true;
    @track isField = false;
    @api showSpinner;
    objectDependencies = [];
    isCombinedPermissionforPerSet = false;
    showUserPerTable = false;
    showTabSetForPerSet = false;
    @track profileVal = 'All';
    @track profLicenseVal = 'All';
    @track licenseval = null;
    assignIdforPerSet = [];
    assigneeIdforUnassigforperset = []
    @track clickedRowValue;
    @track clickedPerSetRowValue;
    @track clickedPerSetLicense;
    userApiName;
    userDescriptionforPerSet;
    userApiNameforPerSet;
    permSetNameList = ['abcd_clone_c'];
    userNameSpacePrefixforPerSet;
    userCreatedByforPerSet;
    userModifiedByforPerSet;
    userLicenseIdforPerSet;
    userLabelforPerSet;
    assignedUserLength;
    activeTabforPerSet = 'AssignedusersForPerSet';
    isCreateDisabled = true;
    @track combinedPermissions = [];
    @track isAssignDisabledforPerSet = true;
    @track userApiName = '';
    @track userDescription = '';
    @track createLabelValue = '';
    @track createApiNameValue = '';
    @track createDescriptionValue = '';
    @track createLabelValueforPerSet = '';
    @track createApiNameValuePerSet = '';
    @track createDescriptionValuePerSet = '';
    @track createPermissionSetObj = {}
    @track searchTerm = '';
    @track searchtermforperset = '';
    @track userLabelCloneForPermissionSet = '';
    @track userApiNameCloneForPermissionSet = '';
    @track userDescriptionCloneForPermissionSet = '';
    @track searchKey = '';
    @track searchKeyps = '';
    @track searchFieldKey = '';
    @track searchTabKey = '';
    isPerSet = false;
    disabledUserEdit = true;
    objDepPermissions = {};
    isUser = false;
    @track systemPermissionSet = [];
    lastSavedUserPermissions = []
    lastsavedtab = []
    @track objList = [];
    @track perSetType;
    editInSysPerSet = true;
    befEditSysPs = true;
    befEditCu = false;
    editinStdObjPerset = true;
    editinCuObjPerset = true;
    editInTabPerSet = true;
    editinRtPerSet = true;
    @track objectPermissions = [];
    @track fieldPermissions = [];
    @api persetData = [];
    @track updatedOtherRecords = [];
    @track availableUsers = [];
    @track usersLength = [];
    @track selectedusers = [];
    @track selectedusersId = [];
    @track selectedusersLength = [];
    @track permissionsMap = {};
    changes = [];
    @track psSystemMap = {};
    @track recordTypeDetails = [];
    @track tabSettings = [];
    @track allPermissions = [];
    befEditTabPs = true;
    befEditRecPs = true;
    @track hasTab = true;
    @track hasField = true;
    @track hasObject = true;
    @track hasUser = true;
    @track openSections = '';
    @track objPermissions = {};
    disabledRecTypeEdit = true;
    hasEditAccess = true;
    @track isSessionChecked = false;
    changedRecordType = [];
    lastSavedObjPerm = {};
    lastSavedFieldPerm = [];
    lastSavedRecType = [];
    @track affectedSobject = [];
    @track selectedIds = new Set();
    @track removedIds = new Set();
    isUser = false
    enabledRecTypeEdit = false;
    isUpdateEnabled = true;
    isUpdateEnabledRec = true;
    isEditRec = true;
    @track hasAvailUser = true;
    @track hasObjAccess = false;
    @track tabChange = [];
    @track wiredResult = [];
    enableDefaultProfile = false;
    isShowObjectSpinner = false;
    type = 'Permission Set';
    perSetNameList = [];
    recordTypeUpdates = [];

    // Improve reactive property declarations
    @track state = {
        permissions: {},
        ui: {
            isLoading: false,
            activeTab: '',
            showModal: false
        }
    };

    // Use private fields for better encapsulation
    #searchTimeout;
    #permissionCache = new Map();
    #lastSavedState = {};

    perSetColumnsfordropdown = [{
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
            fieldName: 'LicenseName',
            sortable: true
        },
        {
            label: 'Is Custom',
            fieldName: 'IsCustom',
            sortable: true
        },
        {
            label: 'Created By',
            fieldName: 'CreatedByName',
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
            fieldName: 'LastModifiedByName',
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
                rowActions: this.getPerSetRowActions
            }
        }
    ]

    userColumns = [{
            label: 'Full Name',
            fieldName: 'fullName',
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
            label: 'is Active',
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
            fieldName: 'fullName',
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

    getPerSetRowActions(row, doneCallback) {
        const actions = [
            {
                label: 'View Permission set',
                name: 'viewperset'
            }
        ];

        doneCallback(actions);
    }

    //From this connectedCallBack Method we get the permission set License & profiles.
    connectedCallback() {
        this.getLicense();
        this.getProfiles();
    }

    @wire(getSetPermission)
    wiredGetSetPermission(result) {
        this.wiredResult = result;
        console.log('Wired Result>>>', result);
        if (result.data) {
            this.persetData = result.data.map(item => {
                return {
                    ...item,
                    LabelLower: item.Label.toLowerCase()
                };
            });
            this.filterPerSetData();
        } else if (result.error) {
            console.error('Error fetching permission sets: ', result.error);
            this.dispatchSpinnerEvent(false);
        }
    }

    //This method is to Create and dispatch custom event
    dispatchSpinnerEvent(value) {
        const spinnerEvent = new CustomEvent('spinnerchange', {
            detail: value
        });
        this.dispatchEvent(spinnerEvent);
    }

    //This getter function returns a string displaying the number of assigned users.
    get AssignedUsers() {
        return `Assigned users(${this.assignedUserLength})`;
    }
    //This getter method function is for searching User/system permissions in UI.
    get filteredSystemPerps() {
        if (this.searchKeyps) {
            return this.systemPermissionSet.filter(userPerm =>
                userPerm.Label.toLowerCase().includes(this.searchKeyps.toLowerCase())
            );
        }
        return this.systemPermissionSet;
    }
    //This getter method function is for searching object permissions in UI.
    get filteredObjPerps() {
        if (this.searchKey) {
            const filtered = this.objList.filter(userPerm =>
                userPerm.label.toLowerCase().includes(this.searchKey.toLowerCase())
            );
            this.hasObject = filtered.length > 0;
            return filtered;
        }
        return this.objList;
    }
    //This getter method function is for searching field permissions in UI.
    get filteredFieldPerps() {
        if (this.searchFieldKey) {
            const filtered = this.fieldPermissions.filter(item =>
                item.label.toLowerCase().includes(this.searchFieldKey.toLowerCase()));
            this.hasField = filtered.length > 0;
            return filtered;
        }
        return this.fieldPermissions;
    }
    //This getter method function is for searching Tab permissions in UI.
    get filteredTab() {
        if (this.searchTabKey) {
            return this.tabSettings.filter(item =>
                item.label.toLowerCase().includes(this.searchTabKey.toLowerCase())
            );

        }
        return this.tabSettings;
    }
    //This getter method function is for searching User/system permissions in UI.
    get filteredAvailableUser() {
        if (this.searchtermforperset) {
            const filtered = this.availableUsers.filter(obj => obj.Name.toLowerCase().includes(this.searchtermforperset.toLowerCase()));
            this.hasAvailUser = filtered.length > 0;
            return filtered;
        } else {
            return this.availableUsers;
        }
    }

    //This function is used for calling search method based on user/object/field/tab.
    handleSearchKeyChange(event) {
        clearTimeout(this.#searchTimeout);
        this.#searchTimeout = setTimeout(() => {
            this.searchKeyps = event.target.value;
            this.applyFilter();
        }, CONSTANTS.DEBOUNCE_DELAY);
    }
    //This function will used to sort data by direction.
    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }
    //This function calls the helper method filterPerSetData
    handlePerSet(event) {
        this.searchPerSetName = event.target.value;
        this.filterPerSetData();
    }
    //Helper method to filters it by searchPerSetName, sorts the results alphabetically
    filterPerSetData() {
        this.persetData = this.wiredResult.data.map(item => {
            return {
                ...item,
                LabelLower: item.Label.toLowerCase()
            };
        });
        this.persetData = this.persetData.filter(grp =>
            grp.LabelLower.includes(this.searchPerSetName.toLowerCase())
        );
        this.persetData.sort((a, b) =>
            a.LabelLower.localeCompare(b.LabelLower)
        );
        this.showPerSetTable = this.persetData.length > 0;
        this.isPerSet = this.showPerSetTable;
        this.dispatchSpinnerEvent(false);
    }
    //Helper method for sorting data
    sortData(fieldName, sortDirection) {
        let data1 = JSON.parse(JSON.stringify(this.persetData));
        let data2 = JSON.parse(JSON.stringify(this.userDataforPerSet));
        let data3 = JSON.parse(JSON.stringify(this.userDataforperserUnassign));
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
        this.persetData = data1;
        this.userDataforPerSet = data2;
        this.userDataforperserUnassign = data3;
    }
    //This function is used to handle to close methods for Assign,Un assign,view for different scenarios.
    handleCancel(event) {
        this.isUpdateEnabled = true;
        if (this.actionPerSetName == 'assignperset') {
            if (event.target.name == 'AssignCancel') {
                this.isModalForPerSetAssign = false;
                this.profileVal = 'All';
                this.searchUserValforPerSet = '';
                this.selectedRowLengthforPerSet = '0';
                this.isAssignDisabledforPerSet = true;
            }
            if (event.target.name == 'AssignConfirmCancel') {
                this.showSpinner = true;
                this.getUnAssignedUserforPerSet(this.clickedPerSetRowValue, this.profileVal, this.profLicenseVal, this.clickedPerSetLicense);
                this.isModalAssignConfirmMessageforPerSet = false;
                this.isModalForPerSetAssign = true;
                this.searchUserValforPerSet = '';
                this.profileVal = 'All';
                this.isAssignDisabledforPerSet = false;
                this.showSpinner = false;
            }

        }
        if (this.actionPerSetName == 'unassignperset') {
            if (event.target.name == 'UnassignCancel') {
                this.isModalForPerSetUnAssign = false;
            }

            if (event.target.name == 'UnAssignConfirmCancel') {
                this.isModalUnAssignConfirmMessageforPermissionSet = false;
                this.isModalForPerSetUnAssign = true;
                this.isAssignDisabledforPerSet = false;
            }
        }
        if (this.actionPerSetName == 'viewperset') {
            if (event.target.name == 'ViewCancel') {
                this.isModalViewPerSet = false;
                this.selectedRowLengthforPerSet = '0';
            }
            if (event.target.name == 'AssignCancel') {
                this.isModalForPerSetAssign = false;
                this.profileVal = 'All';
                this.searchUserValforPerSet = '';
                this.isModalViewPerSet = true;
                this.selectedRowLengthforPerSet = '0';
                this.isAssignDisabledforPerSet = true;
            }
            if (event.target.name == 'AssignConfirmCancel') {
                this.isModalAssignConfirmMessageforPerSet = false;
                this.isModalForPerSetAssign = true;
                this.searchUserValforPerSet = '';
                this.profileVal = 'All';
                this.isAssignDisabledforPerSet = false;
            }
            if (event.target.name == 'UnassignCancel') {
                this.isModalForPerSetUnAssign = false;
                this.isModalViewPerSet = true;
                this.selectedRowLengthforPerSet = '0';
                this.isAssignDisabledforPerSet = true;
            }
            if (event.target.name == 'UnAssignConfirmCancel') {
                this.isModalUnAssignConfirmMessageforPermissionSet = false;
                this.isModalViewPerSet = true;
                this.isAssignDisabledforPerSet = false;
            }
        }
        if (event.target.name == 'permissionCancel') {
            this.searchKeyps = '';
            this.searchKey = '';
            this.searchFieldKey = '';
            this.searchTabKey = '';
            this.disabledObjEdit = true;
            this.disabledFieldEdit = true;
            this.disabledRecTypeEdit = true;
            this.disabledUserEdit = true;
            this.befEditTabPs = true;
            if ((this.clickedPerSetLicense.startsWith('Chatter') || this.clickedPerSetLicense == 'Lightning Platform Starter') && this.perSetType == 'Custom') {
                this.hasEditAccess = true;
            }
            this.tabValue = 'User permissions';
            this.isCombinedPermissionforPerSet = false;
            this.isModalViewPerSet = true;
        }

        if (event.target.name == 'EditCancel') {
            this.userApiNameforPerSet = this.originalUserApiNameforPerSet;
            this.userLabelforPerSet = this.originalUserLabelforPerSet;
            this.userDescriptionforPerSet = this.originalUserDescriptionforPerSet;
            this.isEditClickedforPermissionSet = false;
            this.isModalViewPerSet = true;
        }

        if (event.target.name == 'DeleteCancel') {
            this.isdeleteClickedforPermissionSet = false;
            this.isModalViewPerSet = true;
        }

        if (event.target.name == 'CloneCancel') {
            this.isCloneClickedforPermissionSet = false;
            this.isModalViewPerSet = true;
        }

        if (event.target.name == 'CloneWithoutUserCancel') {
            this.isCloneClickedforPermissionSetusers = false;
            this.isModalViewPerSet = true;
        }
    }

    //This function is used for closing any related modals and clearing selected values and search terms.
    closeModal() {
        this.isCreatePerSetClicked = false;
        this.isCreatedNext = false;
        this.isCreateSave = false;
        this.isCreateSaveforPermissionSet = false;
        this.createLabelValue = '';
        this.createApiNameValue = '';
        this.createDescriptionValue = '';
        this.selectedPermissionSets = [];
        this.selectedusers = [];
        this.isCreateDisabled = true;
        this.searchtermforperset = '';
        this.selectedusersLength = '0';
        this.hasAvailUser = true;
        this.createPermissionSetObj = {};
    }
    //This function sets the active tab for a permission set based on the selected tab's value from the event.
    handleviewassigntabforPermissionSet(event) {
        this.activeTabforPerSet = event.target.value;
    }

    //This function is used to enables the assign action for a permission set.
    handleAssignforPermissionSet() {
        this.isModalForPerSetAssign = true;
        this.isModalAssignConfirmMessageforPerSet = true;
        let datatableoneforperset = this.template.querySelector('lightning-datatable[data-id="datatableoneforperset"]');
        let selectedRowsoneforperset = datatableoneforperset.getSelectedRows();
        this.assignIdforPerSet = selectedRowsoneforperset.map(row => row.Id);
        console.log('Assignee Id', JSON.stringify(this.assignIdforPerSet));
        this.isAssignDisabledforPerSet = false;
    }
    //This method is used for inserting users to permission set.
    handleConfirmAssignforPermissionSet() {
        this.isModalAssignConfirmMessageforPerSet = false;
        this.showSpinner = true;
        insertUsertoPermissionSet({
                userId: this.assignIdforPerSet,
                perSetId: this.clickedPerSetRowValue
            })
            .then(result => {
                console.log('Assignment check ', result);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'User successfully assigned',
                        variant: 'success',
                    }),
                );
                this.searchUserValforPerSet = '';
                this.profileVal = 'All';
                this.isAssignDisabledforPerSet = true;
                this.userDataforperserUnassign = [];
                this.getUnAssignedUserforPerSet(this.clickedPerSetRowValue, this.profileVal, this.profLicenseVal, this.clickedPerSetLicense);
                this.getAssignedUserforPerSet(this.clickedPerSetRowValue);
                if (this.actionPerSetName == 'assignperset') {
                    this.isModalForPerSetAssign = true;
                }
                if (this.actionPerSetName == 'viewperset') {
                    this.isModalForPerSetAssign = false;
                    this.isModalViewPerSet = true;
                }
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
                this.isAssignDisabledforPerSet = true;
                this.showSpinner = false;
            });
            this.selectedRowLengthforPerSet = '0';
    }
    //This function initializes user assignment by resetting selected row length, enabling assignment modal, hiding the view modal, and fetching unassigned users for the selected permission set.
    handleAssignUserforpermisisonset() {
        this.selectedRowLengthforPerSet = '0';
        this.isAssignDisabledforPerSet = true;
        this.isModalViewPerSet = false;
        this.isModalForPerSetAssign = true;
        this.showSpinner = true;
        this.getUnAssignedUserforPerSet(this.clickedPerSetRowValue, '', '', this.clickedPerSetLicense);
    }
    //This function prepares unassignment by retrieving selected rows from the datatable, enabling the unassignment modal, and setting flags for assignment and confirmation.
    handleunAssignforPermissionSet() {
        let datatabletwoforperset = this.template.querySelector('lightning-datatable[data-id="datatabletwoforPerSet"]');
        let selectedRowstwoforperset = datatabletwoforperset.getSelectedRows();
        this.assigneeIdforUnassigforperset = selectedRowstwoforperset.map(row => row.Id);
        if (this.actionPerSetName == 'unassignperset') {
            this.isModalForPerSetUnAssign = true;
        }
        if (this.actionPerSetName == 'viewperset') {
            this.isModalViewPerSet = true;
        }
        this.isAssignDisabledforPerSet = false;
        this.isModalUnAssignConfirmMessageforPermissionSet = true;

    }
    //This function is used to remove a user from a permission set, shows a success message, and updates the UI accordingly.
    handleConfirmUnAssignforPermissionSet() {
        this.isModalUnAssignConfirmMessageforPermissionSet = false;
        this.showSpinner = true;
        deleteUserfromPermissionSet({
                userId: this.assigneeIdforUnassigforperset,
                perSetId: this.clickedPerSetRowValue
            })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'User removed successfully',
                        variant: 'success',
                    })
                );
                this.getAssignedUserforPerSet(this.clickedPerSetRowValue);
                if (this.actionPerSetName === 'viewperset') {
                    this.isModalViewPerSet = true;
                } else if (this.actionPerSetName === 'unassignperset') {
                    this.isModalForPerSetUnAssign = true;
                }
                this.isAssignDisabledforPerSet = true;
                this.showSpinner = false;
            })
            .catch((error) => {
                console.error('Error unassigning permission set', error);
                this.isAssignDisabledforPerSet = true;
                this.showSpinner = false;
            });
    }
    //This function updates the createPermissionSetObj fields based on input values for label, API name, and description, ensuring the API name follows the required format.
    handleInputCreatePerSet(event) {
    const field = event.target.dataset.id;
    const value = event.target.value;

    if (field === 'label') {
        console.log('OUTPUT INPUT CREATE >: ', value);
        this.createPermissionSetObj.Label = value;
        if (value) {
            this.createPermissionSetObj.Name = value.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') + '_c';
            this.isCreateDisabled = false;
        } else {
            this.createPermissionSetObj.Name = '';
            this.isCreateDisabled = true;
        }
    } else if (field === 'apiName') {
        this.createPermissionSetObj.Name = value
        this.createPermissionSetObj.Name = value.replace(/[^a-zA-Z0-9_]/g, '');
    } else if (field === 'description') {
        this.createPermissionSetObj.Description = value;
    }
}

    //This function updates the profLicenseVal based on the selected value and calls permissionSetUserHandler and getUnAssignedUserforPerSet with the updated values.
    handleUserLicense(event) {
        this.profLicenseVal = event.target.value;
        this.permissionSetUserHandler(this.profileVal, this.profLicenseVal, this.clickedRowValue);
        this.getUnAssignedUserforPerSet(this.clickedPerSetRowValue, this.profileVal, this.profLicenseVal, this.clickedPerSetLicense);
    }
    //This function updates the profileVal based on the selected value, calls permissionSetUserHandler, getUnAssignedUserforPerSet.
    handleProfile(event) {
        this.profileVal = event.target.value;
        this.permissionSetUserHandler(this.profileVal, this.profLicenseVal, this.clickedRowValue);
        this.getUnAssignedUserforPerSet(this.clickedPerSetRowValue, this.profileVal, this.profLicenseVal, this.clickedPerSetLicense);
        this.selectedRowLengthforPerSet = '0';
    }
    //This function updates the selectedRowLengthforPerSet and disables the assignment button if no rows are selected.
    handleRowSelectionforPerSet(event) {
        let selectedRowsforPerSet = event.detail.selectedRows;
        this.selectedRowLengthforPerSet = selectedRowsforPerSet.length;
        this.isAssignDisabledforPerSet = selectedRowsforPerSet.length === 0;
    }
    //This function is used for calling the creation modal(first modal) template in html.
    handlePerSetClick() {
        this.isCreatePerSetClicked = true;
    }
    //This function updates the searchUserValforPerSet and calls getUnAssignedUserforPerSet with the updated values.
    handlePerSetUser(event) {
        this.searchUserValforPerSet = event.target.value;
        this.getUnAssignedUserforPerSet(this.clickedPerSetRowValue, this.profileVal, this.profLicenseVal, this.clickedPerSetLicense);
    }
    //This function handles different row actions ('assignperset', 'unassignperset', 'viewperset') by setting relevant flags, fetching assigned/unassigned users, displaying modals, and enabling or disabling actions based on the selected row's data.
    handleRowActionPerSet(event) {
        let row = event.detail.row
        this.perSetType = row.NamespacePrefix != null ? 'Standard' : 'Custom';
        this.clickedPerSetLicense = row.LicenseName || '';
        this.hasEditAccess = this.perSetType != 'Custom' ? false : true;
        this.actionPerSetName = event.detail.action.name;
        if (event.detail.action.name == 'assignperset') {
            this.clickedPerSetRowValue = row.Id;
            this.perSetNameList = this.clickedPerSetRowValue;
            this.getUnAssignedUserforPerSet(this.clickedPerSetRowValue, '', '', this.clickedPerSetLicense);
            this.isAssignDisabledforPerSet = true;
            this.showSpinner = true;
            this.isModalForPerSetAssign = true;
        } else if (event.detail.action.name == 'unassignperset') {
            this.clickedPerSetRowValue = row.Id;
            this.getAssignedUserforPerSet(this.clickedPerSetRowValue);
            this.isAssignDisabledforPerSet = true;
            this.isModalForPerSetUnAssign = true;
            this.showSpinner = true;
        } else if (event.detail.action.name == 'viewperset') {
            this.activeTabforPerSet = 'AssignedusersForPerSet';
            this.clickedPerSetRowValue = row.Id;
            this.isModalViewPerSet = true;
            this.originalUserApiNameforPerSet = row.Name;
            this.originalUserLabelforPerSet = row.Label;
            this.originalUserDescriptionforPerSet = row.Description || '-';
            this.userApiNameforPerSet = this.originalUserApiNameforPerSet;
            this.permSetNameList = this.originalUserApiNameforPerSet;
            this.userLabelforPerSet = this.originalUserLabelforPerSet;
            this.userDescriptionforPerSet = this.originalUserDescriptionforPerSet;
            this.userNameSpacePrefixforPerSet = row.NamespacePrefix || '-';
            this.userCreatedByforPerSet = row.CreatedByName || '-';
            this.userModifiedByforPerSet = row.LastModifiedByName || '-';
            this.userLicenseIdforPerSet = row.LicenseId;
            this.getAssignedUserforPerSet(this.clickedPerSetRowValue);
            this.isAssignDisabledforPerSet = true;
            this.showSpinner = true;
        }
    }
    //This function updates the License property of createPermissionSetObj with the selected value from the event.
    handleLicense(event) {
        this.createPermissionSetObj.License = event.target.value;
    }
    //This function handles different actions (Edit, Delete, Clone) based on the button clicked, and prepares the necessary data for cloning or editing permission set details.
    handleClickforPermissionSet(event) {
        if (event.target.innerText === 'Edit Property') {
            this.isEditClickedforPermissionSet = true;
            this.isModalViewPerSet = false;
        } else if (event.target.innerText === 'Delete') {
            this.isdeleteClickedforPermissionSet = true;
            this.isModalViewPerSet = false;
        } else if (event.target.innerText === 'Clone With Users' || event.target.innerText === 'Clone Without Users') {
            this.userLabelCloneForPermissionSet = this.userLabelforPerSet + '_clone';
            this.userApiNameCloneForPermissionSet = this.userApiNameforPerSet + '_clone';
            this.userDescriptionCloneForPermissionSet ='This is ' + this.userLabelforPerSet + ' clone';
            if (event.target.innerText === 'Clone With Users') {
                this.isCloneClickedforPermissionSet = true;
            } else {
                this.isCloneClickedforPermissionSetusers = true;
            }
            this.isModalViewPerSet = false;
            setTimeout(() => {
                const clonedLabelInput = this.template.querySelector('[data-id="clonedLabel"]');
                if (clonedLabelInput) {
                    clonedLabelInput.addEventListener('input', (event) => {
                        this.userLabelCloneForPermissionSet = event.target.value;
                        this.userApiNameCloneForPermissionSet = this.userLabelCloneForPermissionSet.replace(/\s+/g, '_') + '_c';
                        const clonedApiNameInput = this.template.querySelector('[data-id="clonedApiName"]');
                        if (clonedApiNameInput) {
                            clonedApiNameInput.value = this.userApiNameCloneForPermissionSet;
                        }
                    });
                }
            }, 100);
        }
    }
    //This function sets the isCombinedPermissionforPerSet flag to true and hides the modal view for the permission set.
    handleCombinedPermissionSet() {
        this.isCombinedPermissionforPerSet = true;
        this.isModalViewPerSet = false;
    }
    //This function filters the allPermissions array based on the searchKeyps value and updates the combinedPermissions array.
    applyFilter() {
        if (this.searchKeyps) {
            this.combinedPermissions = this.allPermissions.filter(item =>
                item.sObjectName.toLowerCase().includes(this.searchKeyps.toLowerCase())
            );
        } else {
            this.combinedPermissions = [...this.allPermissions];
        }
    }
    //This function enables edit mode for the permission set based on the selected tab and updates various flags for UI control.
    handleEditsysPermissionSet() {
        console.log('Clicked Edit');
        this.isUpdateEnabled = true;
        if (this.tabValue == 'Tab Setting') {
            this.editInTabPerSet = false;
            this.befEditTabPs = false;
            this.disabledUserEdit = true;
        }
        if (this.tabValue == 'Record Type') {
            this.editinRtPerSet = false;
            this.befEditRecPs = false;
            this.disabledUserEdit = true;
            this.befEditTabPs = true;
        }
        if (this.tabValue == 'User permissions') {
            this.editInSysPerSet = false;
            this.disabledUserEdit = false;
        }
    }
    //This function resets flags to enable editing for object, user, and field settings, and activates the edit icon.
    handleEdit() {
        this.editInPsg = false;
        this.disabledObjEdit = false;
        this.disabledUserEdit = false;
        this.disabledFieldEdit = false;
        this.editIcon = true;
    }
    //This function sets the editinsdobjperset flag to false, disabling editing for the specified object permission set.
    handleEditsdobjPermissionSet() {
        this.editinStdObjPerset = false;
    }
    //This function sets the befeditcu flag to true and the editincuobjperset flag to false, preparing for editing a custom object permission set.
    handleEditcuobjPermissionSet() {
        this.befEditCu = true;
        this.editinCuObjPerset = false;
    }
    //This function resets various flags and data based on the event and tab value, restoring the last saved configurations for user permissions, tab settings, object permissions, and record types.
    handleCancelPermissionSet(event) {
        this.searchKey = '';
        if (event.target.name == 'User Cancel' && this.tabValue == 'User permissions') {
            this.editInSysPerSet = true;;
            this.disabledUserEdit = true;
            this.isUpdateEnabled = true;
            this.psSystemMap = {};
            this.systemPermissionSet = JSON.parse(JSON.stringify(this.lastSavedUserPermissions));
        }
        if (this.tabValue == 'Tab Setting') {
            this.isUpdateEnabled = true;
            this.tabChange = [];
            this.tabSettings = JSON.parse(JSON.stringify(this.lastsavedtab));
            this.editInTabPerSet = true;
            this.befEditTabPs = true;
        }
        if (event.target.name == 'Object Cancel') {
            this.editInPsg = true;
            this.editIcon = false;
            this.disabledUserEdit = true;
            this.disabledObjEdit = true;
            this.disabledFieldEdit = true;
            this.affectedSobject = [];
            this.isUpdateEnabled = true;
            this.objPermissions = JSON.parse(JSON.stringify(this.lastSavedObjPerm));
            this.fieldPermissions = JSON.parse(JSON.stringify(this.lastSavedFieldPerm));
        }
        if (event.target.name == 'RecType Cancel') {
            this.isUpdateEnabledRec = true;
            this.changedRecordType = [];
            this.disabledRecTypeEdit = true;
            this.enabledRecTypeEdit = false;
            this.isEditRec = true;
            this.isEditable = false;
            this.recordTypeDetails = JSON.parse(JSON.stringify(this.lastSavedRecType));
            console.log('check recordTypeDetails', JSON.stringify(this.recordTypeDetails));
        }
    }
    //This function updates the label, API name, and description for a permission set based on the field changed in the input event.
    handleInputChangeforPermissionSet(event) {
        let field = event.target.dataset.id;
        if (field === 'label') {
            this.userLabelforPerSet = event.target.value;
            if (this.userLabelforPerSet) {
                this.userApiNameforPerSet = this.userLabelforPerSet.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') + '_c';
                this.isCreateDisabled = false;
            } 
        } else if (field === 'apiName') {
            this.userApiNameforPerSet = event.target.value;
        } else if (field === 'description') {
            this.userDescriptionforPerSet = event.target.value;
        }
    }
    //This method is used to save the updated permission set details.
    handleSaveforPermissionSet() {
        this.showSpinner = true;
        this.handleInputChangeforPermissionSet(event);
        this.isEditClickedforPermissionSet = false;
        editPermissionSet({
                perSet: this.clickedPerSetRowValue,
                label: this.userLabelforPerSet,
                apiName: this.userApiNameforPerSet,
                description: this.userDescriptionforPerSet
            })
            .then(result => {
                console.log('Edited perSet result >>> ', JSON.stringify(result));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Permission Set successfully updated',
                        variant: 'success',
                    }),
                );
                this.originalUserApiNameforPerSet = this.userApiNameforPerSet;
                this.originalUserLabelforPerSet = this.userLabelforPerSet;
                this.originalUserDescriptionforPerSet = this.userDescriptionforPerSet;
                this.showSpinner = false;
                return refreshApex(this.wiredResult);
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
                this.userApiNameforPerSet = this.originalUserApiNameforPerSet;
                this.userLabelforPerSet = this.originalUserLabelforPerSet;
                this.userDescriptionforPerSet = this.originalUserDescriptionforPerSet;
                this.showSpinner = false;
                return refreshApex(this.wiredResult);
            })
        this.isModalViewPerSet = true;
    }
    //This function is used for deleting the selected permission set.
    handleDeleteforPermissionSet() {
        this.isdeleteClickedforPermissionSet = false;
        this.showSpinner = true;
        deletePerSet({
                permissionSetId: this.clickedPerSetRowValue
            })
            .then(result => {
                console.log('cloned Result >> ', JSON.stringify(result));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Permission Set successfully deleted',
                        variant: 'success',
                    }),
                );
                this.showSpinner = false;
                return refreshApex(this.wiredResult);
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
                return refreshApex(this.wiredResult);
            })
    }

    //This function updates clone fields (label, API name, and description) for a permission set based on user input.
    handleCloneInputChangeforPermissionSet(event) {
        const field = event.target.dataset.id;
        const value = event.target.value;
        console.log('Event >>> ', event);
        if (field === 'label') {
            this.userLabelCloneForPermissionSet = value;
            this.userApiNameCloneForPermissionSet = value.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') + '_c';
            console.log('label val >> ', this.userLabelCloneForPermissionSet);
        } else if (field === 'apiName') {
            console.log('OUTPUT : ', event.target.value);
            this.userApiNameCloneForPermissionSet = value.replace(/[^a-zA-Z0-9_]/g, '');
        } else if (field === 'description') {
            console.log('OUTPUT : ', event.target.value);
            this.userDescriptionCloneForPermissionSet = value;
        }
    }

    //This method is used for cloning Permission Set(With Users)
    handleCloneforPermissionSetwithusers() {
        this.showSpinner = true;
        this.handleCloneInputChangeforPermissionSet(event);
        this.isCloneClickedforPermissionSet = false;
        clonePermissionSetwithUsers({
                sourcePermissionSetId: this.clickedPerSetRowValue,
                newLabel: this.userLabelCloneForPermissionSet,
                newApiName: this.userApiNameCloneForPermissionSet,
                newDescription: this.userDescriptionCloneForPermissionSet,
                newLicense: this.userLicenseIdforPerSet
            })
            .then(result => {
                console.log('cloned Result >> ', JSON.stringify(result));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Permission Set successfully cloned',
                        variant: 'success',
                    }),
                );
                this.showSpinner = false;
                return refreshApex(this.wiredResult);
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
                this.isCloneClickedforPermissionSet = true;
                this.showSpinner = false;
            });
    }

    //This method is used for cloning Permission Set(Without Users)
    handleCloneforPermissionSetwithoutusers() {
        this.showSpinner = true;
        this.handleCloneInputChangeforPermissionSet(event);
        this.isCloneClickedforPermissionSetusers = false;
        clonePermissionSetWithoutUser({
                newLabel: this.userLabelCloneForPermissionSet,
                newApiName: this.userApiNameCloneForPermissionSet,
                newDescription: this.userDescriptionCloneForPermissionSet,
                newLicense: this.userLicenseIdforPerSet
            })
            .then(result => {
                console.log('cloned Result >> ', JSON.stringify(result));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Permission Set successfully cloned',
                        variant: 'success',
                    }),
                );
                this.showSpinner = false;
                return refreshApex(this.wiredResult);
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
            });


    }
    //This method is used for checking duplicate label & api name while creating permission set.
    handleNextforPermissionSet() {
        checkPermissionSetExists({
                label: this.createPermissionSetObj.Label,
                apiName: this.createPermissionSetObj.Name
            })
            .then(exists => {
                if (exists) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: 'A Permission Set with the same Label or API Name already exists.',
                            variant: 'error'
                        })
                    );
                } else {
                    this.showSpinner = true;
                    this.isCreatedNextforPermissionSet = true;
                    this.isCreatePerSetClicked = false;
                    this.getUsers(this.createPermissionSetObj.License);
                }
            })
            .catch(error => {
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
    //This function resets various fields and flags related to permission set creation, closing the modal and clearing input values, selections.
    handleCloseModal() {
        this.isCreateSave = false;
        this.isCreatedNext = false;
        this.createLabelValue = '';
        this.createApiNameValue = '';
        this.createDescriptionValue = '';
        this.selectedPermissionSets = [];
        this.selectedusers = [];
        this.isCreateDisabled = true;
        this.searchtermforperset = '';
        this.selectedusersLength = '0';
        this.hasAvailUser = true;
        this.createPermissionSetObj = {};
    }
    //This function updates the search term for filtering permission sets based on the input value from the event.
    handleSearchChangeforperset(event) {
        this.searchtermforperset = event.target.value;
        this.filteredAvailableUser;
    }
    //This function is used to move selected users from the available users list to the selected users list and removes added users from the available list.
    handleAddUser() {
        this.selectedIds.forEach(id => {
            console.log('id', id);
            const set = this.availableUsers.find(set => set.Id === id);
            if (set) {
                this.selectedusers = [...this.selectedusers, set];
                this.selectedusersLength = this.selectedusers.length;
                this.isUser = this.selectedusersLength > 0;
                this.selectedusersId = this.selectedusers.map(item => item.Id);
                this.availableUsers = this.availableUsers.filter(item => item.Id !== id);
                this.selectedIds.delete(id);
            }
        });
        this.usersLength = this.availableUsers.length;
        this.updateHighlight();
        console.log('this.selectedusersId', JSON.stringify(this.selectedusersId));
    }
    //This function is used to move specified users from the selected list back to the available list and removes the users from the selected list.
    handleRemoveUser() {
        this.removedIds.forEach(id => {
            const set = this.selectedusers.find(set => set.Id === id);
            if (set) {
                this.availableUsers = [...this.availableUsers, set];
                this.usersLength = this.availableUsers.length;
                this.selectedusers = this.selectedusers.filter(item => item.Id !== id);
                this.selectedusersLength = this.selectedusers.length;
                this.removedIds.delete(id);
            }
        });
        this.selectedusersId = this.selectedusers.map(item => item.Id);
        this.updateHighlight();
        console.log('this.selectedPermissionSetId', JSON.stringify(this.selectedusersId))
    }
    //This method fetches users linked to a permission set group based on profile name, user license, and group ID, updates userData with profile and license names, and toggles the visibility of the assignment table based on the data received.
    permissionSetUserHandler(profName, useLicense, perSetGroupId) {
        getUserPermissionSetGroup({
                profileName: profName,
                userLicense: useLicense,
                perSetGrpId: perSetGroupId
            })
            .then(res => {
                this.userData = res.map(item => {
                    return {
                        ...item,
                        profileName: item.Profile?.Name,
                        userLicense: item.Profile?.UserLicense.Name
                    }
                })
                if (this.userData.length > 0) {
                    this.showAssignTable = true;
                } else {
                    this.showAssignTable = false;
                }
                this.showSpinner = false;
                console.log('permSetGrp Result >>> : ', JSON.stringify(this.userData));
            })

    }
    //This function reopens the permission set creation modal and hides the "next" step view.
    handleBackforPermissionSet() {
        this.isCreatePerSetClicked = true;
        this.isCreatedNextforPermissionSet = false;
        this.selectedIds.clear();
        this.selectedusers = [];
        this.selectedusersId = [];
        this.selectedusersLength = '0';
    }
    //This Function will used to handle Next Button for 1st Modal
    handleclickNextforPermissionSet() {
        this.isCreateSaveforPermissionSet = true;
        this.isCreatedNextforPermissionSet = false;
    }
    //This Function will used to handle to Close Next Modal 
    handleNextCloseModalforPermissionSet() {
        this.isCreatedNextforPermissionSet = true;
        this.isCreateSaveforPermissionSet = false;
        this.searchtermforperset = '';
        this.hasAvailUser = true;
    }
    //This method is used to handle the hasActivationRequired field for new PermissionSet Creation
    handleSessionChange(event) {
        this.createPermissionSetObj.hasActivationRequired = event.target.checked;
        this.isSessionChecked = event.target.checked;
    }
    //This method creates a new permission set with specified users and resets selected users and form fields after creation.
    handleCreateforPerSet() {
        this.isCreateSaveforPermissionSet = false;
        this.showSpinner = true;

        createPermissionSet({
            permSetToCreate: this.createPermissionSetObj,
            userIds: this.selectedusersId
        })
            .then(result => {
                console.log('Edited perSet result >>> ', JSON.stringify(result));
                this.showSpinner = false;
                this.resetFormValues();
                this.showToast('Success', 'Permission Set successfully created', 'success');
                return refreshApex(this.wiredResult);
            })
            .catch(error => {
                this.showSpinner = false;
                const errorMessage = this.extractErrorMessage(error.body.message);
                this.showToast('Error', errorMessage, 'error');
                this.resetFormValues();
            })
    }

    resetFormValues() {
        this.selectedIds?.clear();
        this.selectedusersId = [];
        this.selectedusers = [];
        this.removedIds?.clear();
        this.selectedusersLength = '0';
        this.createPermissionSetObj = {};
        this.isCreateDisabled = true;
    }

    extractErrorMessage(errorMessage) {
        return errorMessage.includes('first error:')
            ? errorMessage.split('first error:')[1].trim()
            : errorMessage;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }

    //This method updates object permissions based on checkbox selections and adjusts related permissions while handling dependencies, then stores the updated permissions in a map.
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
        this.permissionsMap[this.dataSetObject] = {
            ...this.objPermissions
        };
        if (this.objectDependencies.length > 0) {
            this.handleDependencies(name, checked);
        }
        console.log('Changed permissions::::::', JSON.stringify(this.permissionsMap));
    }
    //Helper method for handling dependency
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
        console.log('Initial this.objDepPermissions:', JSON.stringify(this.objDepPermissions));
        let objDependentPerm = JSON.parse(JSON.stringify(this.objDepPermissions));
        console.log('Cloned objDependentPerm:', JSON.stringify(objDependentPerm));
        const affectedPermissions = [];

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
                            this.permissionsMap[objectName] = objDependentPerm[objectName];
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
                        this.permissionsMap[objectName] = objDependentPerm[objectName];
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
                    let processedPermissions = {};
                    if (!processedPermissions[objectName]) {
                        processedPermissions[objectName] = {};
                    }
                    if (processedPermissions[objectName] && processedPermissions[objectName][valueKey]) {
                        return;
                    }
                    if (this.permissionsMap[reqObjectName][valueKey] === this.objDepPermissions[reqObjectName][valueKey]) {
                        this.permissionsMap[objectName] = depPermissionValue ? JSON.parse(JSON.stringify(depPermissionValue)) : {};
                    } else {
                        this.permissionsMap[objectName][valueKey] = this.permissionsMap[reqObjectName][valueKey];
                        if (!this.permissionsMap[objectName][valueKey]) {
                            relatedPermissionsUncheckMap[relatedPerm].forEach(depPerm => {
                                const depValueKey = `Permissions${depPerm.charAt(0).toUpperCase() + depPerm.slice(1)}`;
                                this.permissionsMap[objectName][depValueKey] = false;
                            });
                        }
                    }
                    processedPermissions[objectName][valueKey] = true;
                    this.objectDependencies.forEach(dep => {
                        if (dep.RequiredPermission === `${objectName}<${relatedPerm}>`) {
                            const [childObjName] = dep.Permission.split('<');
                            if (this.permissionsMap[childObjName]) {
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
                    if (this.permissionsMap[objectName][valueKey] === reqPermission[valueKey]) {
                        this.permissionsMap[reqObjName][valueKey] = depPermissionValue[valueKey];
                    }
                    this.objectDependencies.forEach(dep => {
                        if (dep.Permission === `${requiredObjectName}<${relatedPerm}>`) {
                            const [parentObjName] = dep.RequiredPermission.split('<');
                            if (this.permissionsMap[parentObjName]) {
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
                if (isChecked && reqObjName === this.dataSetObject && this.permissionsMap[objName]) {
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
                if (!isChecked && objName == this.dataSetObject && this.permissionsMap[reqObjName]) {
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
    //This function updates record type permissions based on checkbox selections and tracks changes in the changedRecordType array.
    handleRecTypePermissionChange(event) {
        this.isUpdateEnabledRec = false;
        this.recordTypeDetails = this.recordTypeDetails.map(recType => {
            if (recType.RecordType === event.target.dataset.name) {
                recType[event.target.name] = event.target.checked
                if (!this.changedRecordType.includes(recType)) {
                    this.changedRecordType.push(recType);
                }
            }
            return recType
        });
    }

    //This function updates field permissions based on checkbox changes and tracks the modified fields in the changes array.
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
                if (!this.changes.includes(field)) {
                    this.changes.push(field);
                }
            }
            return field;
        });
    }

    //This function updates tab visibility and availability settings based on checkbox changes and tracks the updates in the tabchange array.
    handleTabPermissionChange(event) {
        this.isUpdateEnabled = false;
        const fieldName = event.target.dataset.fieldapi;
        const field = event.target.dataset.field;
        const isChecked = event.target.checked;
        let tabSetting = this.tabSettings.find(item => item.name === fieldName);
        if (!tabSetting) {
            tabSetting = {
                name: fieldName,
                visibility: false,
                availability: false
            };
            this.tabSettings.push(tabSetting);
        }
        let newValue = null;
        if (field === 'Visible') {
            if (isChecked) {
                newValue = 'Visible';
                tabSetting.visibility = true;
                tabSetting.availability = true;
            } else {
                if (tabSetting.availability) {
                    newValue = 'Available';
                } else {
                    newValue = null;
                }
                tabSetting.visibility = false;
            }
        } else if (field === 'Available') {
            if (isChecked) {
                newValue = 'Available';
                tabSetting.availability = true;
            } else {
                newValue = null;
                tabSetting.availability = false;
                tabSetting.visibility = false;
            }
        }
        const index = this.tabChange.findIndex(item => item[fieldName] !== undefined);
        if (index > -1) {
            this.tabChange[index] = {
                [fieldName]: newValue
            };
        } else if (newValue !== null) {
            this.tabChange.push({
                [fieldName]: newValue
            });
        } else {
            this.tabChange.push({
                [fieldName]: null
            });
        }
        console.log('Final Tab Setting:', JSON.stringify(this.tabChange));
    }

    //This function updates system permission values in the systemPermissionSet array and tracks the changes in the psSystemMap.
    handlesystemPermissionChangeps(event) {
    this.isUpdateEnabled = false;
    const fieldApi = event.target.dataset.fieldapi.replace('Permissions', '');
    const isChecked = event.target.checked;
    this.psSystemMap[fieldApi] = isChecked;

    try {
        if (isChecked) {
            this.checkPermissionDependencies(fieldApi);
        } else {                
            this.uncheckPermissionDependencies(fieldApi);
        }
    } catch (error) {
        console.error('Error in handlesystemPermissionChangeps:', error.message || error, error.stack || '');
    }
    this.systemPermissionSet = this.systemPermissionSet.map(user => {
        const permissionKey = user.Name.replace('Permissions', '');
        if (this.psSystemMap.hasOwnProperty(permissionKey)) {
            user.Value = this.psSystemMap[permissionKey];
        }
        return user;
    });
    this.psSystemMap = Object.fromEntries(
        Object.entries(this.psSystemMap).map(([key, value]) => [`Permissions${key.replace(/^Permissions/, '')}`, value])
    );

    console.log('Updated SystemMap:', JSON.stringify(this.psSystemMap));
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


    //This method updates system permissions, object permissions, and tab settings based on the selected tab value and displays appropriate success or error messages, handling various scenarios asynchronously.
    async handleUpdatePermissionSet() {
        if (this.tabValue == 'User permissions') {
            this.showSpinner = true;
            this.showUserPerTable = false;
            if (this.psSystemMap == null || this.psSystemMap == undefined) {
                this.psSystemMap = {};
            }
            const systempermissionsMap = JSON.stringify(this.psSystemMap);
            updateSystemPermissions({
                    systemPermissionsMap: systempermissionsMap,
                    psid: this.clickedPerSetRowValue
                })
                .then(res => {
                    console.log('check update res', JSON.stringify(res));
                    this.isUpdateEnabled = true;
                    res.forEach(updatedItem => {
                        Object.keys(updatedItem).forEach((key) => {
                            let lowercaseKey = key.toLowerCase();
                            this.systemPermissionSet = this.systemPermissionSet.map(userPerm => {
                                if (userPerm.Name == lowercaseKey) {
                                    userPerm.Value = updatedItem[key];
                                }
                                return userPerm
                            })

                        })

                    })
                    this.lastSavedUserPermissions = JSON.parse(JSON.stringify(this.systemPermissionSet));
                    this.showUserPerTable = true;
                    this.disabledUserEdit = true;
                    this.editInSysPerSet = true;
                    this.befEditSysPs = true;
                    this.showSpinner = false;
                    this.psSystemMap = {};
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'user permission updated successfully',
                            variant: 'Success'
                        })
                    );
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
                    this.systemPermissionSet = JSON.parse(JSON.stringify(this.lastSavedUserPermissions));
                    this.showSpinner = false;
                    this.disabledUserEdit = true;
                    this.showUserPerTable = true;
                    this.editInSysPerSet = true;
                    this.befEditSysPs = true;
                    this.isUpdateEnabled = true;
                    this.psSystemMap = {};
                });

        }
        if (this.tabValue == 'Object Permissions') {
            this.showSpinner = true;
            for (let key in this.permissionsMap) {
                if (key != this.dataSetObject) {
                    this.affectedSobject.push(key);
                }
            }
            if (this.affectedSobject.length > 0) {
                const result = await LightningConfirm.open({
                    message: `[${this.affectedSobject}] These objects will be impacted after saving the records. Are you sure you want to change it?`,
                    variant: 'default',
                    label: "Affected Objects"
                });
                if (result) {
                    this.objUpdateHandler(this.permissionsMap,this.clickedPerSetRowValue)
                } else {
                    this.showSpinner = false;
                    this.disabledObjEdit = false;
                    this.disabledFieldEdit = false;
                    this.disabledRecTypeEdit = true;
                    this.editInPsg = false;
                    this.changes = [];
                    this.changedRecordType = [];
                    this.isUpdateEnabled = true;
                    this.permissionsMap = {};
                    this.editIcon = false;
                    this.isEditRec = true;
                    this.isUpdateEnabled = false;
                    this.affectedSobject = [];
                }
            } else {
                this.objUpdateHandler(this.permissionsMap,this.clickedPerSetRowValue)
            }

        }
        if (this.tabValue == 'Tab Setting') {
            this.showSpinner = true;
            this.showTabSetForPerSet = false;
            updatetab({
                    tabSettingsJson: JSON.stringify(this.tabChange),
                    persetname: this.userApiNameforPerSet
                })
                .then(res => {
                    console.log('OUTPUT : res', res);
                    res.forEach(updatedItem => {
                        this.tabSettings = this.tabSettings.map(userPerm => {
                            if (userPerm.name === updatedItem.tab) {
                                if (updatedItem.visibility === 'Visible') {
                                    userPerm.visibility = updatedItem.visibility;
                                    userPerm.availability = updatedItem.visibility;
                                }
                                if (updatedItem.visibility === 'Available') {
                                    userPerm.availability = updatedItem.visibility;
                                }
                            }
                            return userPerm;
                        });

                    });
                    this.lastsavedtab = JSON.parse(JSON.stringify(this.tabSettings));
                    this.showTabSetForPerSet = true;
                    this.befEditTabPs = true;
                    this.editInTabPerSet = true;
                    this.befEditTabPs = true;
                    this.showSpinner = false;
                    this.isUpdateEnabled = true;
                    this.tabChange = [];
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Tab setting updated successfully',
                            variant: 'Success'
                        })
                    );
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
                    this.tabSettings = JSON.parse(JSON.stringify(this.lastsavedtab));
                    this.showSpinner = false;
                    this.showTabSetForPerSet = true;
                    this.editInTabPerSet = true;
                    this.befEditTabPs = true;
                    this.isUpdateEnabled = true;
                });
        }
    }
    //This method is used for updating object and field permissions
    objUpdateHandler(objMap,permSetId) {
        updateSobjectMeta({
                objPerms: objMap,
                permSetId: permSetId
            })
            .then(res => {
                console.log('check res' + JSON.stringify(res));
                if (res != null) {
                    if (res.objectPerms != null && res.objectPerms != undefined) {
                        if (res.objectPerms[this.dataSetObject]) {
                            this.objPermissions = res.objectPerms[this.dataSetObject];
                        }
                        Object.keys(res.objectPerms).forEach((key) => {
                            this.objDepPermissions[key] = res.objectPerms[key];
                        })
                    }
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Successfully Upserted Object Permissions',
                            variant: 'success'
                        })
                    );
                    this.showSpinner = false;
                    this.disabledObjEdit = true;
                    this.isUpdateEnabled = true;
                    this.editInPsg = true;
                    this.changes = [];
                    this.permissionsMap = {};
                    this.lastSavedObjPerm = JSON.parse(JSON.stringify(this.objPermissions));
                    this.editIcon = false;
                    this.isEditRec = true;
                } else {
                    let errorMessage = err.body.message;
                    let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: extractedMessage,
                            variant: 'error'
                        })
                    );
                    this.objPermissions = JSON.parse(JSON.stringify(this.lastSavedObjPerm));
                    this.showSpinner = false;
                    this.disabledObjEdit = true;
                    this.isUpdateEnabled = true;
                    this.editInPsg = true;
                    this.changes = [];
                    this.permissionsMap = {};
                    this.editIcon = false;
                    this.isEditRec = true;
                }
            })
            .catch(err => {
                console.error('Error In Updating:', err.body.message);
                let errorMessage = err.body.message;
                let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: extractedMessage,
                        variant: 'error'
                    })
                );
                this.objPermissions = JSON.parse(JSON.stringify(this.lastSavedObjPerm));
                this.showSpinner = false;
                this.disabledObjEdit = true;
                this.isUpdateEnabled = true;
                this.editInPsg = true;
                this.changes = [];
                this.permissionsMap = {};
                this.editIcon = false;
                this.isEditRec = true;
            })
    }
    //This method fetches and processes profile and license data,sorting and organizing them into selectable options for profiles, user licenses, and licenses.
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
    //This method fetches and processes user and permission set licenses, sorting them into selectable options, and combines them with a "None" option while handling any errors.
    getLicense() {
        getPermissionSetLicenseCreate()
            .then(result => {
                let userLicenses = result.UserLicense || [];
                let permissionSetLicenses = result.PermissionSetLicense || [];
                let noneOptionLicense = {
                    label: 'None',
                    value: null
                };
                let mappedUserLicenses = userLicenses.map(item => ({
                    label: item.MasterLabel,
                    value: item.Name
                }));
                let sortedUserLicenses = mappedUserLicenses.sort((a, b) => a.label.localeCompare(b.label));
                let mappedPermissionSetLicenses = permissionSetLicenses.map(item => ({
                    label: item.MasterLabel,
                    value: item.Name
                }));
                let sortedPermissionSetLicenses = mappedPermissionSetLicenses.sort((a, b) => a.label.localeCompare(b.label));
                this.combinedLicenseValue = [
                    noneOptionLicense,
                    ...sortedUserLicenses,
                    ...sortedPermissionSetLicenses
                ];
                this.createPermissionSetObj.License = noneOptionLicense.value;
                console.log('Sorted User Licenses >>', JSON.stringify(sortedUserLicenses));
            })
            .catch(error => {
                console.error('Error retrieving licenses', error);
            });
    }

    //This method fetches users based on a specified license name, maps their profile and license details, and updates the available users list while hiding the spinner once the data is loaded.
    getUsers(licensename) {
        getUserforPermissionSet({
                licenseName: licensename
            })
            .then(res => {
                console.log('User', res);
                this.availableUsers = res.map(result => {
                    return {
                        ...result,
                        profileName: result.Profile?.Name,
                        userLicense: result.Profile?.UserLicense.Name
                    }
                })
                this.usersLength = res.length;
                this.showSpinner = false;
            })
    }
    // This method fetches unassigned users for a specified permission set, filters them based on a search value, and updates the user data while handling any errors.
    getUnAssignedUserforPerSet(permissionsetId, profilevalue, userlicensevalue, licenseName) {
        getUnAssignedUserForPermissionSet({
                permissionSetId: permissionsetId,
                profileName: profilevalue,
                userLicense: userlicensevalue,
                licenseName: licenseName
            })
            .then(res => {
                console.log('UnAssigned User', res);
                this.userDataforperserUnassign = res.map(item => {
                    return {
                        ...item,
                        fullName: item.Name,
                        profileName: item.Profile?.Name,
                        userLicense: item.Profile?.UserLicense.Name
                    };
                });
                this.userDataforperserUnassign = this.userDataforperserUnassign.filter(perset =>
                    perset.Name.toLowerCase().includes(this.searchUserValforPerSet)
                );
                this.showAssignTableforPerSet = this.userDataforperserUnassign.length > 0;
                this.showSpinner = false;
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
            });
    }
    //This method fetches unassigned users for a specified permission set, filters them based on a search value, and updates the user data while handling any errors.
    getAssignedUserforPerSet(permissionsetId) {
        getAssignedUserForPermissionSet({
                permissionSetId: permissionsetId
            })
            .then(res => {
                console.log('Assigned User', res);
                this.userDataforPerSet = res.map(item => {
                    return {
                        ...item,
                        fullName: item.Name,
                        profileName: item.Profile?.Name,
                        userLicense: item.Profile?.UserLicense.Name
                    }
                })
                if (this.userDataforPerSet.length > 0) {
                    this.showUnAssignTableforPerSet = true;
                    this.showUnAssignTableforPerSetforView = true;
                } else {
                    this.showUnAssignTableforPerSet = false;
                    this.showUnAssignTableforPerSetforView = false;
                }
                this.showSpinner = false;
                this.assignedUserLength = this.userDataforPerSet.length;
                console.log('permSetGrp Result >>> : ', JSON.stringify(this.userDataforPerSet));
            })
    }
    //This method fetches and processes combined permissions for a profile, sorting and displaying system and user permissions while handling errors.
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
                this.isUser = this.systemPermissionSet.length > 0 ? true : false;
                this.lastSavedUserPermissions = JSON.parse(JSON.stringify(this.systemPermissionSet));
                return this.systemPermissionSet;
            })
            .catch(error => {
                console.error('Error in getCombinedPermissionforPerSet: ', error);
                this.showSpinner = false;
                throw error;
            });

    }
    //This function toggles the visibility of an accordion item, updates its icon, and manages various state variables and permissions based on the item's current state.
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
                console.log('Inside Else >>>>> : ');
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
            this.fieldPermissions = [];
            this.recordTypeDetails = [];
            this.isShowObjectSpinner = true;
            this.isEditable = false;
            this.enabledRecTypeEdit = false;
            this.searchFieldKey = '';
            this.disabledFieldEdit = true;
            this.disabledObjEdit = true;
            this.disabledRecTypeEdit = true;
            this.hasField = true;
            this.isUpdateEnabled = true;
            if (this.editInPsg == false) {
                this.editInPsg = true;
            }
            this.editIcon = false;
            this.isEditRec = true;
            this.getSobjectPermissionsForPermissionSet(this.clickedPerSetRowValue, this.dataSetObject, this.userApiNameforPerSet);
        } else {
            this.showSpinner = false;
        }
        console.log('OUTPUT : this.objList', JSON.stringify(this.objList));
    }
    //This method retrieves object and field permissions for a specified permission set.
    getSobjectPermissionsForPermissionSet(permSetId, objName, profileName) {
        getSobjectPermissionsForPermissionSet({
                permSetId: permSetId,
                objName: objName,
                profileNames: profileName
            })
            .then(res => {
                console.log('check res' + JSON.stringify(res))
                this.isShowObjectSpinner = false;
                if (this.clickedPerSetLicense.startsWith('Chatter') || this.clickedPerSetLicense == 'Lightning Platform Starter') {
                    this.hasObjAccess = false;
                    this.editIcon = true;
                    this.isEditRec = false;
                } else {
                    this.hasObjAccess = res['hasObjAccess'];
                    this.editIcon = false;
                    this.isEditRec = true;
                }
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
                console.error('Error in getSobjectPermissionsForPermissionSet: ', err);
                this.showSpinner = false;
                throw err;
            })
    }
    //This method fetches tab settings for a given permission set.
    getPermissionSetTabSettinghandler(persetname) {
        getPermissionSetTabSetting({
                permissionSetName: persetname
            })
            .then(result => {
                console.log('Tab Settings: ', result);

                this.tabSettings = result.map(item => {
                    return {
                        label: item.Label,
                        name: item.Name,
                        visibility: item.Visibility === 'Visible',
                        availability: item.Visibility === 'Visible' || item.Visibility === 'Available'
                    };
                });
                this.lastsavedtab = JSON.parse(JSON.stringify(this.tabSettings));
                this.showTabSetForPerSet = this.tabSettings.length > 0;
                this.showSpinner = false;
            })
            .catch(error => {
                console.error('Error: ', JSON.stringify(error));
                this.showSpinner = false;
            });

    }
    //This function is used for slicing the records from total records.
    updateHandler(event) {
        if (event.detail.slicedRecords != undefined && event.detail.slicedRecords.length > 0) {
            this.updatedOtherRecords = [...event.detail.slicedRecords];
        }
    }
    //This function handles tab selection changes, updating various flags, search keys, and data based on the selected tab value ('User permissions', 'Object Permissions', or 'Tab Setting').
    handleTabValue(event) {
        this.tabValue = event.target.value;
        this.showSpinner = true;
        this.hasEditAccess = true;
        this.hasObject = true;
        this.hasField = true;
        this.isUpdateEnabled = true;
        this.isUpdateEnabledRec = true;
        if (this.tabValue == 'User permissions') {
            this.objList = [];
            this.hasEditAccess = this.perSetType != 'Custom' ? false : true;
            this.objectPermissions = [];
            this.fieldPermissions = [];
            this.recordTypeDetails = [];
            this.disabledFieldEdit = true;
            this.disabledObjEdit = true;
            this.befEditTabPs = true;
            this.disabledRecTypeEdit = true;
            this.searchTabKey = '';
            this.searchKey = '';
            this.searchFieldKey = '';
            this.editInPsg = true;
            this.editInTabPerSet = true;
            this.enabledRecTypeEdit = false;
            this.isEditRec = true;
            this.isEditable = false;
            this.disabledFieldEdit = false;
            this.hasField = true;
            this.hasObject = true;
            this.hasTab = true;
            this.getCombinedPermissionsforProfile(this.clickedPerSetRowValue);
        }
        if (this.tabValue == 'Object Permissions') {
            if (this.clickedPerSetLicense.startsWith('Chatter') || this.clickedPerSetLicense == 'Lightning Platform Starter') {
                this.hasEditAccess = false;
            } else {
                this.hasEditAccess = this.perSetType != 'Custom' ? false : true;
            }
            this.searchKeyps = '';
            this.searchTabKey = '';
            this.befEditTabPs = true;
            this.disabledUserEdit = true;
            this.editInSysPerSet = true;
            this.editInTabPerSet = true;
            this.hasUser = true;
            this.hasTab = true;
            this.getProfileObjectDetails(this.clickedPerSetRowValue);
        }
        if (this.tabValue == 'Tab Setting') {
            this.objList = [];
            if (this.clickedPerSetLicense.startsWith('Chatter') || this.clickedPerSetLicense == 'Lightning Platform Starter') {
                this.hasEditAccess = false;
            } else {
                this.hasEditAccess = this.perSetType != 'Custom' ? false : true;
            }
            this.getPermissionSetTabSettinghandler(this.permSetNameList);
            this.objectPermissions = [];
            this.fieldPermissions = [];
            this.recordTypeDetails = [];
            this.searchKey = '';
            this.searchFieldKey = '';
            this.searchKeyps = '';
            this.disabledFieldEdit = true;
            this.disabledObjEdit = true;
            this.disabledRecTypeEdit = true;
            this.disabledUserEdit = true;
            this.editInSysPerSet = true;
            this.editInPsg = true;
            this.enabledRecTypeEdit = false;
            this.isEditRec = true;
            this.isEditable = false;
            this.disabledFieldEdit = false;
            this.hasField = true;
            this.hasObject = true;
            this.hasUser = true;
        }
    }
    //This method fetches profile object details, processes them into a list of objects with access permissions, and updates the UI accordingly.
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
                })
            })
            .catch(err => {
                console.log('Error in getCombinedPermissionforPerSet: ', err);
                this.showSpinner = false;
                throw err;
            })
    }

    //This method toggles the selection of a user ID in the selectedIds set and updates the highlight state accordingly.
    handleAddClickValue(event) {
        const userId = event.currentTarget.dataset.id;
        if (this.selectedIds.has(userId)) {
            this.selectedIds.delete(userId);
        } else {
            this.selectedIds.add(userId);
        }
        this.updateHighlight();
    }
    //This method toggles the removal of a user ID in the removedIds set and updates the highlight state accordingly.
    handleRemoveClickValue(event) {
        const userId = event.currentTarget.dataset.id;
        if (this.removedIds.has(userId)) {
            this.removedIds.delete(userId);
        } else {
            this.removedIds.add(userId);
        }
        this.updateHighlight();
    }

    //This method updates the highlighting of elements by adding or removing the 'selected-user' class based on the selectedIds and removedIds sets.
    updateHighlight() {
        this.template.querySelectorAll('.slds-grid').forEach(item => {
            item.classList.remove('selected-user');
        });
        this.selectedIds.forEach(selectedId => {
            const selectedItem = this.template.querySelector(`.available-user[data-id="${selectedId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected-user');
            }
        });
        this.removedIds.forEach(removedId => {
            const removedItem = this.template.querySelector(`.select-user[data-id="${removedId}"]`);
            if (removedItem) {
                removedItem.classList.add('selected-user');
            }
        });

    }
    //This method is for updating record types.
    handleRecTypeUpdate() {
        this.showSpinner = true;
        updateRecordType({
                permissionSetNames: this.originalUserApiNameforPerSet,
                recordTypeUpdates: this.changedRecordType
            })
            .then(res => {
                console.log('New Method to update record type');
                console.log(res);
                this.showSpinner = false;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'RecordType Updated SuccessFully',
                        variant: 'success'
                    })
                )
                this.isUpdateEnabledRec = true;
                this.enabledRecTypeEdit = false;
                this.disabledRecTypeEdit = true;
                this.changedRecordType = [];
                this.editIcon = false;
                this.isEditRec = true;
                this.recordTypeDetails = this.recordTypeDetails.map(recType => {
                    let updatedRecordType = res.find(updated => updated.RecordType === recType.RecordType);
                    return updatedRecordType ? updatedRecordType : recType;
                });
                this.lastSavedRecType = JSON.parse(JSON.stringify(this.recordTypeDetails));
            }).catch(err => {
                console.log(res);
                this.showSpinner = false;
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
                this.isUpdateEnabledRec = true;
                this.enabledRecTypeEdit = false;
                this.disabledRecTypeEdit = true;
                this.changedRecordType = [];
                this.editIcon = false;
                this.isEditRec = true;
                this.recordTypeDetails = JSON.parse(JSON.stringify(this.lastSavedRecType))
                console.log('check recordTypeDetails', JSON.stringify(this.recordTypeDetails));
            })
    }
    //This method enables record type editing by updating UI states to allow editing and disabling related fields.
    handleRecTypeEdit() {
        this.enabledRecTypeEdit = true;
        this.disabledRecTypeEdit = false;
        this.isEditable = true;
        this.isEditRec = false;
    }

    // Add proper error handling
    async handlePermissionSetOperation(operation) {
        try {
            this.state.ui.isLoading = true;
            await operation();
            this.showSuccessToast('Operation completed successfully');
        } catch (error) {
            this.handleError(error);
        } finally {
            this.state.ui.isLoading = false;
        }
    }

    // Improve input validation
    validatePermissionSet(permissionSet) {
        const errors = [];
        if (!CONSTANTS.REGEX.API_NAME.test(permissionSet.Name)) {
            errors.push('Invalid API Name format');
        }
        return errors;
    }
}