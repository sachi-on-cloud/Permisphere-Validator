//This Component is Used to Handle the List of User based on Selected User Permisisons object permission and fieldPermissions
//This Component is used as child Component under PermissionAnalyzer
import { LightningElement, api, track } from 'lwc';
import getFieldDefinition from '@salesforce/apex/PermissionTabServer.getFieldDefinition';
import getPermsandUsersOfSelectedPerms from '@salesforce/apex/PermissionTabServer.getPermsandUsersOfSelectedPerms';
import getUserPerm from '@salesforce/apex/PermissionTabServer.getUserPerm';
import getObjOrFieldPerm from '@salesforce/apex/PermissionTabServer.getObjOrFieldPerm';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

// Add constants for better maintainability
const CONSTANTS = {
    DEBOUNCE_DELAY: 300,
    PAGE_SIZE: 100,
    MAX_SELECTIONS: 5
};

// Add error handling decorator
const handleError = (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args) {
        try {
            return originalMethod.apply(this, args);
        } catch (error) {
            console.error(`Error in ${propertyKey}:`, error);
            // Handle error appropriately
        }
    };
    return descriptor;
};

export default class ManagePermissionComponent extends LightningElement {
    isUser = true;
    isObject = false;
    isField = false;
    isUserAllAccess = false
    isUserAll = false;
    isObjectAll = false;
    isFieldAll = false;
    isUserProfile = false;
    isUserProfileAll = false;
    isObjectProfile = false;
    isFieldProfile = false;
    isUserpermSet = false;
    isUserPermSetAll = false;
    isObjectPermSet = false;
    isfieldPermSet = false;
    isUserPermSetGrp = false;
    isUserpermSetGrpAll = false;
    isObjectPermSetGrp = false;
    isfieldPermSetGrp = false;
    searchUserEnabled = false;
    isSelected=false
    permissionTypeValue = "User";
    userPermissionValue;
    userObjectValue;
    objectPermissionValue;
    fieldPermissionValue;
    objectValue;
    userPerLicenseOptions;
    isObjectSelected = true;
    isFieldObjectSelected = true;
    profileValue = 'All';
    permissionSetValue = 'All';
    permissionSetGroupValue = 'All';
    @track currentPage = 1;
    @track totalPages = 0;
    fieldValue = '';
    isFieldSelected = true;
    isPermissionEnabledPermission = true;
    showTable = false;
    showSpinner = false;
    maxLimitExceeded = true;
    disablePrevious = true;
    disableNext = true;
    noFieldFound = false;
    disableSelect = false;
    showLimitMessage = false;
    @track enabledUserPermission = [];
    @track sortBy = 'IsActive';
    @track sortDirection = 'desc';
    @api updatedOtherRecords;
    @track fieldOptions = [];
    @track profileOptions = [];
    @track permissionSetOption = [];
    @track permissionSetGroupOption = [];
    totalRecords = 0;
    noUserWithPermission = false;
    selectedPermissionLabel = ''
    selectedPermissionTypeLabel = ''
    profileOptionSet;
    @track pagedData = [];
    recordsPerPage = 0;
    _userPermissionOptions;
    _userObjectOptions;
    @track selectedApiName = [];
    @track showDropdown = false;
    showPermissions=false; 
    isInputFocused = false;
    isDropdownFocused = false;  
    disableSearch = true
    showPopOver = false;
    profileName;
    permSetName;
    permSetGrpName;
    isProfile = false;
    isPermSet = false;
    isPermSetGrp = false;
    selectedPermissionValue=[];
    permissionTypeOptions = [
       { label: "User", value: "User", type: "text" },
       { label: "Object", value: "Object", type: "text" },
       { label: "Field", value: "Field", type: "text" }
    ];
    datacolumns = [
       {
          label: 'FUll Name',
          fieldName: 'Name',
       },
       {
          label: 'User Name',
          fieldName: 'Username',
       },
       {
          label: 'Alias',
          fieldName: 'Alias',
       },
       {
          label: 'Profile',
          fieldName: 'profileName',
       },
       {
          label: 'Active',
          fieldName: 'IsActive',
          type: 'boolean',
          sortable: true,
       },
       {
          label: 'Last Login',
          fieldName: 'LastLoginDate',
          type: 'date',
          typeAttributes: {
             year: 'numeric',
             month: 'short',
             day: '2-digit',
          },
       }
    ]
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

    objectPermissionOptions = [
       { label: "Create", value: "PermissionsCreate", type: "text" },
       { label: "Read", value: "PermissionsRead", type: "text" },
       { label: "Edit", value: "PermissionsEdit", type: "text" },
       { label: "Delete", value: "PermissionsDelete", type: "text" },
       { label: "View All Records", value: "PermissionsViewAllRecords", type: "text" },
       { label: "Modify All Records", value: "PermissionsModifyAllRecords", type: "text" }
    ];
    fieldPermissionOptions = [
       { label: "Read", value: "PermissionsRead", type: "text" },
       { label: "Edit", value: "PermissionsEdit", type: "text" }
    ];
     //Getter Setter Method to get User Permissions from parent
      @api
     get userPermissionOptions() {
         return this._userPermissionOptions;
     }
     set userPermissionOptions(value) {
         this._userPermissionOptions = value;
     }
     //Getter Setter Method to get Object EntityDefinition from Parent
     @api
     get userObjectOptions() {
         return this._userObjectOptions;
     }
     set userObjectOptions(value) {
         this._userObjectOptions = value;
     }
 //This Method is used to change combobox event handler from User to Object to field.
    handlePermissionTypeChange(event) {
       this.permissionTypeValue = event.detail.value;
       console.log('OUTPUT : event.detail.value',JSON.stringify(event.detail.value));
       if(event.detail.value == 'Object')
       {
         console.log('OUTPUT : userPermissionValue',JSON.stringify(this.userPermissionValue));
         console.log('OUTPUT : userObjectValue',JSON.stringify(this.userObjectValue));
         console.log('OUTPUT : profileValue',JSON.stringify(this.profileValue));
         console.log('OUTPUT : permissionSetValue',JSON.stringify(this.permissionSetValue));
         console.log('OUTPUT : permissionSetGroupValue',JSON.stringify(this.permissionSetGroupValue));
       }
       this.handleclear();
    }
    //This is Helper method is used to sory datatable
    sortData(fieldname, direction) {
       let parseData = JSON.parse(JSON.stringify(this.enabledUserPermission));
       let keyValue = (a) => {
          return a[fieldname];
       };
       let isReverse = direction === 'desc' ? -1 : 1;
       parseData.sort((x, y) => {
          x = keyValue(x) ? keyValue(x) : ''; 
          y = keyValue(y) ? keyValue(y) : '';
          return isReverse * ((x > y) - (y > x));
       });
       this.enabledUserPermission = parseData;
    }
    @track userPermissionVal = [];
    @track selectedPermissions = [];
     toggleDropdown() {
     this.showDropdown = !this.showDropdown;
 }
 //This Method is used to handle User Permission ComboBox event change
    handleUserPermissionChange(event) {
         this.profileValue = 'All';
         this.permissionSetValue = 'All';
         this.permissionSetGroupValue = 'All';
         this.profileOptions = [];
         this.permissionSetOption = [];
         this.permissionSetGroupOption = [];
         this.isUserpermSet = false;
         this.isUserPermSetGrp = false;
         this.isUserProfile = false;
         this.showFiles = false;
         this.isPermissionEnabledPermission = true;
         this.userPermissionValue = event.detail.value;
         const newPermission = event.detail.value;
         if (!this.userPermissionVal.includes(newPermission)) {
             this.userPermissionVal = [...this.userPermissionVal, newPermission];
             const selectedOption = this._userPermissionOptions.find(option => option.value === newPermission);
             if (selectedOption) {
                 this.selectedPermissions = [...this.selectedPermissions, selectedOption];
             }
         }
            this.showDropdown = false;
     }
      //This getter funtion we handled search User Permissions in UI level.
     get filteredUserPerm(){
         if(this.userPermissionValue){
             return this._userPermissionOptions.filter(userPerm =>
                 userPerm.label.toLowerCase().includes(this.userPermissionValue.toLowerCase()));
         }
         return this._userPermissionOptions;
     }
     //This Method is used to handle after User permission is Selected
     handlePermissionSelect(event) {
         this._userPermissionOptions = this._userPermissionOptions.map(permission=>{
             let permObj = permission;
             if(permission.value == event.currentTarget.dataset.value){
                 permObj = {...permission, isClicked: !permission.isClicked, checked:false}
                 if(permObj.isClicked && !this.selectedPermissions.some(p => p.value === permObj.value)){
                     if(this.selectedPermissions.length <= 4){
                         this.selectedPermissions.push(permObj)
                     }else{
                         this.showLimitMessage = true;
                         permObj = {...permission, isClicked: false}
                     }
                 }
                 else if(!permObj.isClicked && this.selectedPermissions.some(p => p.value === permObj.value)){
                     this.selectedPermissions = this.selectedPermissions.filter(p => p.value !== permObj.value);  
                     if(this.selectedPermissions.length <= 4){
                         this.showLimitMessage = false;
                     }                  
                 }
             }
              return permObj;
         })
         this.isSelected = this.selectedPermissions.length>0?true:false;
         this.showPermissions = false;
         this.isDropdownFocused = false;
         this.userPermissionValue = ''
     }

     get selectedPermissionsAsString() {
         return this.selectedPermissions.join(', ');
     }
     //This Method is used to Initiate the User Search Input come Combobox event.
     handleInputClick()
     {
         this.showPermissions=true;
         this.isInputFocused = true; 
     }
     //This Method is used to handle the Objects change
      handleObjectChange(event) {
         this.profileOptions = [];
         this.permissionSetGroupOption = [];
         this.permissionSetOption = []
         this.userObjectValue = event.detail.value;
         this.isObjectSelected = false;
         this.objectPermissionValue = '';
         this.showTable = false;
         this.isPermissionEnabledPermission = true;
         let selectedOption = this.userObjectOptions.find(option => option.value === this.userObjectValue)
         if (selectedOption) {
             this.selectedObject = selectedOption.label;
         }
     }
     //This Method is used to handle the Object Permissions change
    handleObjectPermissionChange(event) {
         this.profileValue = 'All';
         this.permissionSetValue = 'All';
         this.permissionSetGroupValue = 'All';
         this.profileOptions = [];
         this.permissionSetGroupOption = [];
         this.permissionSetOption = []
         this.isObjectpermSet = false;
         this.isObjectPermSetGrp = false;
         this.isObjectProfile = false;
         this.showSpinner = true;
         this.showFiles = false;
         this.isPermissionEnabledPermission = true;
         this.objectPermissionValue = event.detail.value;
         let selectedOption = this.objectPermissionOptions.find(option => option.value === this.objectPermissionValue)
         if (selectedOption) {
             this.selectedPermissionLabel = selectedOption.label;
         }
         this.handlePermissionHandlerCall([], this.userObjectValue, this.objectPermissionValue, '', '', '', 'All');
         this.isObjectAll = true;
     }
     //This Method is used to handle the Object change for field permissionType
    handleFieldObjectChange(event) {
         this.isFieldSelected = true;
         this.profileOptions = [];
         this.permissionSetOption = [];
         this.permissionSetGroupOption = [];
         this.objectValue = event.detail.value;
         this.isPermissionEnabledPermission = true;
         let selectedOption = this.userObjectOptions.find(option => option.value === this.objectValue)
         if (selectedOption) {
             this.selectedObject = selectedOption.label;
         }
         this.fieldValue = '';
         this.fieldPermissionValue = '';
         this.showTable = false;
         getFieldDefinition({
                 objectName: this.objectValue
             })
             .then(res => {
                 console.log('check map result', res);
                 this.fieldOptions = []
                 res.forEach(r => {
                     this.fieldOptions.push({
                         label: r.Label,
                         value: r.Name
                     })
                 })
                 this.fieldOptions.sort((a, b) => a.label.localeCompare(b.label));
                 if (this.fieldOptions.length === 0) {
                     this.isFieldObjectSelected = true;
                     this.noFieldFound = true;
                 } else {
                     this.isFieldObjectSelected = false;
                     this.noFieldFound = false;
                 }
             })
     }
     //This Method is used to handle the field change
    handleFieldChange(event) {
         this.profileOptions = [];
         this.permissionSetOption = [];
         this.permissionSetGroupOption = [];
         this.fieldValue = event.detail.value;
         this.isPermissionEnabledPermission = true;
         let selectedOption = this.fieldOptions.find(option => option.value === this.fieldValue)
         if (selectedOption) {
             this.selectedField = selectedOption.label;
         }
         this.isFieldSelected = false;
         this.fieldPermissionValue = '';
         this.showTable = false;
     }
     //This Method is used to navigate to user in PermissionValidator tab
     handleUserRowActionChild(event) {
         this.dispatchEvent(new CustomEvent("userrowaction", {
             detail: event.target.dataset,
             bubbles: true,            
             composed: true,
         }));
     }
 //This Method is used to handle the Field Permissions change
    handleFieldPermissionChange(event) {
       this.profileValue = 'All';
       this.permissionSetValue = 'All';
       this.permissionSetGroupValue = 'All';
       this.profileOptions = [];
       this.permissionSetGroupOption = [];
       this.permissionSetOption = []
       this.isFieldpermSet = false;
       this.isFieldPermSetGrp = false;
       this.isFieldProfile = false;
       this.showSpinner = true;
       this.fieldPermissionValue = event.detail.value;
       let selectedOption = this.fieldPermissionOptions.find(option => option.value === this.fieldPermissionValue)
       if (selectedOption) {
          this.selectedPermissionLabel = selectedOption.label;
       }
       this.handlePermissionHandlerCall([], '', '', this.objectValue, this.fieldValue, this.fieldPermissionValue, 'All')
       this.isPermissionEnabledPermission = false;
       this.isFieldAll = true;
   }
   //This Method is to handle to retrieve List of Users through server based on User/Object/Field Permissions.
   @handleError
   async handlePermissionHandlerCall(userPermissions, objNameValue, objPermissionValue, fieldObj, fieldNameVal, fieldPermVal, permValue) {
        try {
            this.sortColumn = '';
            this.sortDirection = '';
            this.textFilters = {};
            this.comboFilters = {};
            this.booleanFilter = false;
            this.dateFilter = null;
            this.pagedData = [];
            this.currentPage = 1;
            this.itemsPerPage = 100;
            this.totalPages = 0;
            this.totalRecords = 0
            this.updatedOtherRecords = [];
            this.disablePrevious = true;
            this.disableNext = true;
            this.userPerLicenseOptions = ''
            this.profileOptionSet = ''
            await getPermsandUsersOfSelectedPerms({
                    userPermissions: userPermissions,
                    objName: objNameValue,
                    objPermission: objPermissionValue,
                    objFieldName: fieldObj,
                    fieldName: fieldNameVal,
                    fieldPerm: fieldPermVal,
                    perSetId: permValue
                })
                .then(res => {
                    console.log('Check User and permission set res : ',JSON.stringify(res));
                    if (res.userList.length > 0) {
                        this.showTable = true;                    
                        this.noUserWithPermission = false;
                        this.totalRecords = res.userList.length;
                        this.enabledUserPermission = res.userList.map(user => {
                            let formattedDate = user.LastLoginDate ? this.formatDate(user.LastLoginDate) : null
                            return {
                                ...user,
                                col1: user.Name,
                                col2: user.Username,
                                col3: user.Title,
                                col4: user.UserRole?.Name,
                                col5: user.Alias,
                                col6: user.Profile?.Name,
                                col7: formattedDate,
                                col8: user.Profile?.UserLicense.Name
                            };
                        });
                        this.sortData(this.sortBy, this.sortDirection);
                    }
                    let userPerLicenseSet = [{
                        label: 'License',
                        value: ""
                    }];
                    let proFileName = [{
                        label: 'Profile',
                        value: ""
                    }]
                    res.userList.forEach(e => {
                        if (e.Profile?.UserLicense.Name != undefined) {
                            userPerLicenseSet.push({
                                label: e.Profile?.UserLicense.Name,
                                value: e.Profile?.UserLicense.Name
                            })
                        }
                        if (e.Profile?.Name != undefined) {
                            proFileName.push({
                                label: e.Profile?.Name,
                                value: e.Profile?.Name
                            })
                        }

                    })
                    this.userPerLicenseOptions = userPerLicenseSet.filter((item, index, self) =>
                        index === self.findIndex((t) => (
                            t.label === item.label && t.value === item.value
                        ))
                    );
                    this.profileOptionSet = proFileName.filter((item, index, self) =>
                        index === self.findIndex((t) => (
                            t.label === item.label && t.value === item.value
                        ))
                    );
                    if (res.userList.length == 0) {
                        this.noUserWithPermission = true;
                        this.showTable = false
                    }
                    if (this.enabledUserPermission.length > 100) {
                        this.disableNext = false;
                    }
                    if (this.enabledUserPermission.length > 50 && this.enabledUserPermission.length <= 100) {
                        this.maxLimitExceeded = false;
                    } else {
                        this.maxLimitExceeded = true;
                    }
                    if (res.permissionSetList.length > 0) {
                        this.isPermissionEnabledPermission = false;
                        let permissionSetArray = res.permissionSetList;
                        let profileType = [{
                            label: 'All',
                            value: 'All'
                        }, {
                            label: 'None',
                            value: 'None'
                        }];
                        let permissionSetType = [{
                            label: 'All',
                            value: 'All'
                        }, {
                            label: 'None',
                            value: 'None'
                        }];
                        let groupType = [{
                            label: 'All',
                            value: 'All'
                        }, {
                            label: 'None',
                            value: 'None'
                        }];

                        permissionSetArray.forEach(obj => {
                            if (obj.Type == 'Profile') {
                                profileType.push({
                                    label: obj.Profile.Name,
                                    value: obj.Id
                                })

                            } else if (obj.Type == 'Group') {
                                groupType.push({
                                    label: obj.Label,
                                    value: obj.Id
                                })
                            } else {
                                permissionSetType.push({
                                    label: obj.Label,
                                    value: obj.Id
                                })

                            }
                        })
                        this.profileOptions = profileType;
                        this.permissionSetOption = permissionSetType;
                        this.permissionSetGroupOption = groupType;
                    }
                    this.showSpinner = false;
                    this.totalPages = Math.ceil(this.enabledUserPermission.length / this.itemsPerPage);
                    this.applyFiltersAndPagination();

                })
        } catch (error) {
            console.error('Error in handlePermissionHandlerCall:', error);
            this.dispatchEvent(new CustomEvent('error', {
                detail: error
            }));
        }
    }
    //This Method is Used handle Profile change
   handleProfileChange(event) {
        this.showSpinner = true;
        this.showTable = false;
        this.selectedPermissionTypeLabel = ''
        this.profileValue = event.target.value;
        this.permissionSetValue = 'All';
        this.permissionSetGroupValue = 'All'
        this.showFiles = false;
        this.disableSearch = true;
        let selectedOption = this.profileOptions.find(option => option.value === this.profileValue)
        if (selectedOption) {
            this.selectedPermissionTypeLabel = selectedOption.label;
            this.permissionSetValue = 'None';
            this.permissionSetGroupValue = 'None';
        }
        if (this.selectedPermissionTypeLabel == 'All') {
            this.permissionSetValue = 'All';
            this.permissionSetGroupValue = 'All';
        }
        this.noPermissionsFound = this.profileValue === 'None' && this.permissionSetValue === 'None' && this.permissionSetGroupValue === 'None';
        if (this.noPermissionsFound) {
            this.showSpinner = false;
            this.noUserWithPermission = false;
        }
         this.handlePermissionHandlerCall(this.selectedApiName, this.userObjectValue, this.objectPermissionValue, this.objectValue, this.fieldValue, this.fieldPermissionValue, this.profileValue)        
        if (this.isUser == true) {   
            if(this.profileValue == 'All'){
                if(this.selectedApiName.length > 1){
                    this.isUserAllAccess = true;
                    this.isUserAll = false;
                }
                if(this.selectedApiName.length == 1){
                    this.isUserAll = true;
                    this.isUserAllAccess = false;
                }
                this.isUserProfile = false;
                this.isUserProfileAll = false;
                this.isUserPermSet = false;
                this.isUserPermSetAll = false;
                this.isUserPermSetGrp = false;
                this.isUserpermSetGrpAll = false
            } else{
                this.isUserAll = false;
                this.isUserAllAccess = false;
                 if(this.selectedApiName.length > 1){
                    this.isUserProfileAll = true;
                    this.isUserProfile = false;
                }
                if(this.selectedApiName.length == 1){
                    this.isUserProfile = true
                    this.isUserProfileAll = false; 
                }
                this.isUserPermSet = false;
                this.isUserPermSetAll = false;
                this.isUserPermSetGrp = false;
                this.isUserpermSetGrpAll = false
            } 

        }
        if (this.isObject == true) {
            if (this.profileValue == 'All') {
                this.isObjectAll = true;
                this.isObjectProfile = false;
                this.isObjectPermSet = false;
                this.isObjectPermSetGrp = false;
            } else {
                this.isObjectProfile = true;
                this.isObjectAll = false;
                this.isObjectPermSet = false;
                this.isObjectPermSetGrp = false;
            }
        }
        if (this.isField == true) {
            if (this.profileValue == 'All') {
                this.isFieldAll = true;
                this.isFieldProfile = false;
                this.isfieldPermSet = false;
                this.isfieldPermSetGrp = false;
            } else {
                this.isFieldProfile = true;
                this.isFieldAll = false;
                this.isfieldPermSet = false;
                this.isfieldPermSetGrp = false;
            }
        }

    }
    //This Method is Used handle PermissionSetGroup change
   handlePermissionSetGroupChange(event) {
        this.showSpinner = true;
        this.showTable = false;
        this.selectedPermissionTypeLabel = ''
        this.permissionSetGroupValue = event.target.value;
        this.profileValue = 'All';
        this.permissionSetValue = 'All';
        this.showFiles = false;
        this.disableSearch = true;
        let selectedOption = this.permissionSetGroupOption.find(option => option.value === this.permissionSetGroupValue)
        if (selectedOption) {
            this.selectedPermissionTypeLabel = selectedOption.label;
            this.profileValue = 'None';
            this.permissionSetValue = 'None';
        }
        if (this.selectedPermissionTypeLabel == 'All') {
            this.profileValue = 'All';
            this.permissionSetValue = 'All';
        }
        this.noPermissionsFound = this.profileValue === 'None' && this.permissionSetValue === 'None' && this.permissionSetGroupValue === 'None';
        if (this.noPermissionsFound) {
            this.showSpinner = false;
            this.noUserWithPermission = false;
        }                
        this.handlePermissionHandlerCall(this.selectedApiName, this.userObjectValue, this.objectPermissionValue, this.objectValue, this.fieldValue, this.fieldPermissionValue, this.permissionSetGroupValue)                  
        if (this.isUser == true) {
            if(this.permissionSetGroupValue == 'All'){
                if(this.selectedApiName.length > 1){
                    this.isUserAllAccess = true;
                    this.isUserAll = false;
                }
                if(this.selectedApiName.length == 1){
                    this.isUserAll = true
                    this.isUserAllAccess = false;
                }
                this.isUserProfile = false;
                this.isUserProfileAll = false;
                this.isUserPermSet = false;
                this.isUserPermSetAll = false;
                this.isUserPermSetGrp = false;
                this.isUserpermSetGrpAll = false
            } else{
                this.isUserAll = false;
                this.isUserAllAccess = false;
                 if(this.selectedApiName.length > 1){
                    this.isUserpermSetGrpAll = true;
                    this.isUserPermSetGrp = false;
                }
                if(this.selectedApiName.length == 1){
                    this.isUserPermSetGrp = true
                    this.isUserPermSetGrpAll = false;
                }
                this.isUserPermSet = false;
                this.isUserPermSetAll = false;
                this.isUserProfile = false;
                this.isUserProfileAll = false
            } 

        }
        if (this.isObject == true) {
            if (this.permissionSetGroupValue == 'All') {
                this.isObjectAll = true;
                this.isObjectProfile = false;
                this.isObjectPermSet = false;
                this.isObjectPermSetGrp = false;
            } else {
                this.isObjectProfile = false;
                this.isObjectAll = false;
                this.isObjectPermSet = false
                this.isObjectPermSetGrp = true;
            }
        }
        if (this.isField == true) {
            if (this.permissionSetGroupValue == 'All') {
                this.isFieldAll = true;
                this.isFieldProfile = false;
                this.isfieldPermSet = false;
                this.isfieldPermSetGrp = false;
            } else {
                this.isFieldProfile = false;
                this.isFieldAll = false;
                this.isfieldPermSet = false;
                this.isfieldPermSetGrp = true;
            }
        }
    }
     //This Method is Used handle PermissionSet change
   handlePermissionSetChange(event) {
        this.showSpinner = true;
        this.showTable = false;
        this.selectedPermissionTypeLabel = false;
        this.permissionSetValue = event.target.value;
        this.profileValue = 'All';
        this.permissionSetGroupValue = 'All';
        this.showFiles = false;
        this.disableSearch = true;
        let selectedOption = this.permissionSetOption.find(option => option.value === this.permissionSetValue)
        if (selectedOption) {
            this.selectedPermissionTypeLabel = selectedOption.label;
            this.profileValue = 'None';
            this.permissionSetGroupValue = 'None';
        }
        if (this.selectedPermissionTypeLabel == 'All') {
            this.profileValue = 'All';
            this.permissionSetGroupValue = 'All';
        }
        this.noPermissionsFound = this.profileValue === 'None' && this.permissionSetValue === 'None' && this.permissionSetGroupValue === 'None';
        if (this.noPermissionsFound) {
            this.showSpinner = false;
            this.noUserWithPermission = false;
        }
        this.handlePermissionHandlerCall(this.selectedApiName, this.userObjectValue, this.objectPermissionValue, this.objectValue, this.fieldValue, this.fieldPermissionValue, this.permissionSetValue)
        if (this.isUser == true) {
            if(this.permissionSetValue == 'All'){
                if(this.selectedApiName.length > 1){
                    this.isUserAllAccess = true;
                    this.isUserAll = false;
                }
                if(this.selectedApiName.length == 1){
                    this.isUserAll = true
                    this.isUserAllAccess = false;
                }
                this.isUserProfile = false;
                this.isUserProfileAll = false;
                this.isUserPermSet = false;
                this.isUserPermSetAll = false;
                this.isUserPermSetGrp = false;
                this.isUserpermSetGrpAll = false
            } else{
                this.isUserAll = false;
                this.isUserAllAccess = false;
                 if(this.selectedApiName.length > 1){
                    this.isUserPermSetAll = true;
                }
                if(this.selectedApiName.length == 1){
                    this.isUserPermSet = true
                }
                this.isUserProfile = false;
                this.isUserProfileAll = false;
                this.isUserPermSetGrp = false;
                this.isUserpermSetGrpAll = false
            } 
        }
        if (this.isObject == true) {
            if (this.permissionSetValue == 'All') {
                this.isObjectAll = true;
                this.isObjectProfile = false;
                this.isObjectPermSet = false;
                this.isObjectPermSetGrp = false;
            } else {
                this.isObjectProfile = false;
                this.isObjectAll = false;
                this.isObjectPermSet = true
                this.isObjectPermSetGrp = false;
            }
        }
        if (this.isField == true) {
            if (this.permissionSetValue == 'All') {
                this.isFieldAll = true;
                this.isFieldProfile = false;
                this.isfieldPermSet = false;
                this.isfieldPermSetGrp = false;
            } else {
                this.isFieldProfile = false;
                this.isFieldAll = false;
                this.isfieldPermSet = true;
                this.isfieldPermSetGrp = false;
            }
        }
    }
    //This Method is used to reset the changes based on PermissionType
     handleclear() {
        if (this.permissionTypeValue == 'User') {
            this.isUser = true;
            this.isObject = false;
            this.isField = false 
        }
        if (this.permissionTypeValue == 'Object') {
            this.isObject = true;
            this.isField = false;
            this.isUser = false
            this._userObjectOptions = [...this._userObjectOptions]; 
        }
        if (this.permissionTypeValue == 'Field') {
            this.isField = true;  
            this.isObject = false;
            this.isUser = false       
        }
        this.isObjectProfile = false;
        this.isUserProfile = false;
        this.isObjectPermSet = false;
        this.isFieldpermSet = false;
        this.isUserPermSet = false;
        this.isObjectPermSetGrp = false;
        this.isFieldPermSetGrp = false;
        this.isUserPermSetGrp = false;
        this.isObjectAll = false;
        this.isFieldAll = false;
        this.isFieldProfile = false;
        this.isUserAll = false;
        this.isUserAllAccess = false
        this.userPermissionValue = '';
        this.userObjectValue = '';
        this.objectPermissionValue = '';
        this.objectValue = '';
        this.fieldValue = '';
        this.fieldPermissionValue = '';
        this.isObjectSelected = true;
        this.isFieldObjectSelected = true;
        this.isFieldSelected = true;
        this.selectedPermissionLabel = '';
        this.selectedPermissionTypeLabel = '';
        this.selectedObject = '';
        this.selectedField = '';
        this.showTable = false;
        this.enabledUserPermission = [];
        this.pagedData = [];
        this.isPermissionEnabledPermission = true;
        this.profileValue = 'All';
        this.permissionSetValue = 'All';
        this.permissionSetGroupValue = 'All';
        this.profileOptions = [];
        this.permissionSetOption = [];
        this.permissionSetGroupOption = [];
        this.disablePrevious = true;
        this.maxLimitExceeded = true;
        this.currentPage = 1;
        this.totalPages = 0;
        this.disableNext = true;
        this.totalRecords = 0;
        this.noUserWithPermission = false;
        this.noFieldFound = false;
        this.profileName = [];
        this.permSetName = [];
        this.permSetGrpName = [];
        this.isProfile = false;
        this.isPermSet = false;
        this.isPermSetGrp = false;
        this.isSelected = false;
        this.searchUserEnabled = false
        this.selectedPermissions = [];
        this.selectedApiName = [];
        this.disableSelect = false;
        this.showLimitMessage = false;
        this.isUserProfileAll = false;
        this.isUserPermSetAll = false;
        this.isUserpermSetGrpAll = false;
        this.showPopOver = false;
        this.disableSearch = true;
        this._userPermissionOptions = this._userPermissionOptions.map(userPerm=>{
            if(userPerm.isClicked == true){
                userPerm.isClicked = false;
            }
            return userPerm;
        })
   }
    //This Method is used to formate the Date based en-US
    formatDate(inputDate) {
        const date = new Date(inputDate);
        const options = {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    }
    /*This Method is to export the list of user retrieved from server to excel document 
    either a entire user list or the current page list*/
    exportToExcel(event) {
        let csvContent = 'data:text/csv;charset=utf-8,';
        if (event.target.name == 'exportcurrentpage') {
            this.currentRecordToExport = this.updatedOtherRecords.map(item => {
                let formattedDate = item.LastLoginDate ? this.formatDate(item.LastLoginDate) : null
                return {
                    "Id": item.Id,
                    "Name": item.Name,
                    "User Name": item.Username,
                    "Title": item.Title,
                    "Role Name": item.Department,
                    "Alias": item.Alias,
                    "Profile Name": item.Profile?.Name,
                    "Active": item.IsActive,
                    "Last Login": formattedDate,
                    "License": item.Profile?.UserLicense.Name

                }
            })
            csvContent += this.convertArrayOfObjectsToCSV(this.currentRecordToExport);
        }
        if (event.target.name == 'exportAll') {
            this.exportAllRecToExcel = this.enabledUserPermission.map(item => {
                let formattedDate = item.LastLoginDate ? this.formatDate(item.LastLoginDate) : null
                return {
                    "Id": item.Id,
                    "Name": item.Name,
                    "User Name": item.Username,
                    "Title": item.Title,
                    "Role Name": item.Department,
                    "Alias": item.Alias,
                    "Profile Name": item.Profile?.Name,
                    "Active": item.IsActive,
                    "Last Login": formattedDate,
                    "License": item.Profile?.UserLicense.Name

                }
            })

            csvContent += this.convertArrayOfObjectsToCSV(this.exportAllRecToExcel);
        }
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'datatable_export.csv');
        document.body.appendChild(link);
        link.click();
    }
    //Helper method to convert the array of object to CSV excel report
     convertArrayOfObjectsToCSV(data) {
        const csv = [];
        const header = Object.keys(data[0]);
        csv.push(header.join(','));
        data.forEach(row => {
            const values = header.map(field => {
                const value = row[field] === undefined ? '' : row[field];
                return '"' + value + '"';
            });
            csv.push(values.join(','));
        });
        return csv.join('\n');
    }
    //This Method is used to  filter list of user in UI level based on Input search events
    handleSearch(event) {
        clearTimeout(this.#searchTimeout);
        this.#searchTimeout = setTimeout(() => {
            this.filterData(event.target.value);
        }, CONSTANTS.DEBOUNCE_DELAY);
    }
    //This Method is used to  filter list of user in UI level based on Lightning-Combobox search
    handleSearchCombo(event) {
        const column = event.target.dataset.id;
        const searchTerm = event.target.value;
        if (searchTerm == 'Active') {
            this.comboFilters[column] = true;
        } else {
            this.comboFilters[column] = searchTerm;
        }
        this.applyFiltersAndPagination();
    }
    //Helper Method is used to sort column from ASC to DESC and vice versa
    sortedColumn(event) {
        const column = event.currentTarget.dataset.id;
        if (column === this.sortColumn) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        this.applyFiltersAndPagination();
    }
    //This Method is used to handle pervious page In pagination handler
    previousHandler() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.pagedData = this.paginate(this.applyFilters(this.enabledUserPermission));
            this.sampleAdd = this.sampleAdd - this.pagedData.length;
        }
        this.handleCurrentPage()
    }
    //This Method is used to handle Next page In pagination handler
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.pagedData = this.paginate(this.applyFilters(this.enabledUserPermission));
            this.sampleAdd = this.sampleAdd + this.pagedData.length;
        }
        this.handleCurrentPage()
    }
    //This Method is used to handle first page In pagination handler
    firstHandler() {
        this.currentPage = 1;
        this.pagedData = this.paginate(this.applyFilters(this.enabledUserPermission));
        this.handleCurrentPage();
    }
    //This Method is used to handle Last page In pagination handler
    lastHandler() {
        this.currentPage = this.totalPages;
        this.pagedData = this.paginate(this.applyFilters(this.enabledUserPermission));
        this.handleCurrentPage();
    }
    //This Method is used to handle Current page In pagination handler
    handleCurrentPage() {
        if (this.currentPage > 1 && this.currentPage != this.totalPages) {            
            this.disablePrevious = false;
            this.disableNext = false;
        }
        if (this.currentPage == 1) {
            this.disableNext = false
            this.disablePrevious = true;
        }
        if (this.currentPage == this.totalPages) {
            this.disableNext = true;
            this.disablePrevious = false;
        }
    }
    //This Method is used to  filter list of user in UI level based on date search
    handleDateFilter(event) {
        this.dateFilter = event.target.value ? this.formatDate(event.target.value) : null
        this.applyFiltersAndPagination();
    }
    //This Helper Method is used to handle pagination by applying filters
    applyFiltersAndPagination() {
        let filteredData = this.applyFilters(this.enabledUserPermission);
        this.totalPages = Math.ceil(filteredData.length / this.itemsPerPage);
        this.pagedData = this.paginate(filteredData);
        this.sampleAdd = this.pagedData.length;
    }
    //Helper Method for pagination
    paginate(data) {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        this.updatedOtherRecords = data.slice(start, end);
        this.recordsPerPage = this.updatedOtherRecords.length;
        return data.slice(start, end);
    }
    //This is helper method and sort the list of user by applying filters.
    applyFilters(data) {
        let filteredData = data;
        for (const [key, value] of Object.entries(this.textFilters)) {
            if (value) {
                filteredData = filteredData.filter(item => item[key] && item[key].toLowerCase().includes(value.toLowerCase()));
            }
        }
        for (const [key, value] of Object.entries(this.comboFilters)) {
            if (value) {
                if (value == 'Inactive') {
                    filteredData = filteredData.filter(item => item[key] === false);
                } else {
                    filteredData = filteredData.filter(item => item[key] === value);
                }
            }
        }
        if (this.dateFilter) {
            filteredData = filteredData.filter(item => item.col7 && item.col7 === this.dateFilter);
        }
        if (this.sortColumn) {
            filteredData.sort((a, b) => {
                let valA = a[this.sortColumn];
                let valB = b[this.sortColumn];
                if (this.sortColumn === 'col7') {
                    valA = valA ? new Date(valA).getTime() : 0;
                    valB = valB ? new Date(valB).getTime() : 0;
                }
                if(valA === null || valA === undefined || valA === '') valA = '';
                if(valB === null || valB === undefined || valB === '') valB = '';
                let comparison = 0;
                if (valA > valB) {
                    comparison = 1;
                } else if (valA < valB) {
                    comparison = -1;
                }
                return this.sortDirection === 'asc' ? comparison : -comparison;
            });
        }
        this.totalRecords = filteredData.length;
        return filteredData
    }
    //Helper method for date sort
    handleKeyDown(event) {
        event.preventDefault();
    }
    //THis Method is used to reset the date search
    clearAll() {
        this.template.querySelector('lightning-input[data-id="col7"]').value = undefined;
        this.dateFilter = null;
        this.applyFiltersAndPagination();
    }
    //This Method is used to handle showToastEvents
    showErrorMessage(message) {
        const errorEvent = new ShowToastEvent({
            title: 'Error',
            message: message,
            variant: 'error',
            mode: 'dismissable'
        });
        this.dispatchEvent(errorEvent);
    }
    //This Method is used to search list of used for selected multiselect User Permissions 
    handleUserSearch(event){
     if(event.target.name == 'beforeSearch'){
        this.showSpinner = true;
        this.userPermissionValue = '';
        this.showLimitMessage = false; 
        const allPermission = { label: 'All', value: 'All', isClicked: true,checked:true};
        if(this.selectedPermissions.length > 1){
            if (!this.selectedPermissions.some(p => p.value === allPermission.value)) {
                this.selectedPermissions.unshift(allPermission);
            }
            this.isUserAllAccess = true;
        }else{
            this.selectedPermissions = this.selectedPermissions.map(e=>{
                this.selectedPermissionLabel = e.label;
                return {...e,checked:true};
            })
            this.isUserAll = true
        }
        this.searchUserEnabled = true;
        this.disableSelect = true;
        this.selectedPermissions.forEach(perm=>{
            if(perm.value != 'All'){
                this.selectedApiName.push(perm.value);
            }
        })
        this.profileOptions = [];
        this.permissionSetOption = [];
        this.permissionSetGroupOption = [];
        this.handlePermissionHandlerCall(this.selectedApiName, '', '', '', '', '', 'All') 
     }
     if(event.target.name == 'afterSearch'){
        this.showSpinner = true;
        this.profileOptions = [];
        this.permissionSetOption = [];
        this.permissionSetGroupOption = [];
        if(this.selectedApiName.length == 1){
            this.selectedPermissionLabel = this.selectedPermissions.find(e=>e.value === this.selectedApiName[0]).label;
        }
        if(this.profileValue == 'All' && this.permissionSetValue == 'All' && this.permissionSetGroupValue == 'All'){
            this.handlePermissionHandlerCall(this.selectedApiName, '', '', '', '', '', 'All') 
            if(this.selectedApiName.length > 1){
                this.isUserAllAccess = true
                this.isUserAll = false;
            }else if(this.selectedApiName.length == 1){
                this.isUserAll = true;
                this.isUserAllAccess = false
            }
            this.isUserProfile = false;
            this.isUserProfileAll = false;
            this.isUserPermSet = false;
            this.isUserPermSetAll = false;
            this.isUserPermSetGrp = false;
            this.isUserpermSetGrpAll = false
        }
        else if(this.profileValue != 'All' && this.profileValue != 'None'){
             this.handlePermissionHandlerCall(this.selectedApiName, '', '', '', '', '', this.profileValue);
             if(this.selectedApiName.length > 1){
                this.isUserProfileAll = true
                this.isUserProfile = false;
            }else if(this.selectedApiName.length == 1){
                this.isUserProfile = true;
                this.isUserProfileAll = false
            }
            this.isUserAll = false;
            this.isUserAllAccess = false;
            this.isUserPermSet = false;
            this.isUserPermSetAll = false;
            this.isUserPermSetGrp = false;
            this.isUserpermSetGrpAll = false
        }else if(this.permissionSetValue != 'All' && this.permissionSetValue != 'None'){
            this.handlePermissionHandlerCall(this.selectedApiName, '', '', '', '', '', this.permissionSetValue);
            if(this.selectedApiName.length > 1){
                this.isUserPermSetAll = true
                this.isUserPermSet = false;
            }else if(this.selectedApiName.length == 1){
                this.isUserPermSet = true;
                this.isUserPermSetAll = false
            }
            this.isUserAll = false;
            this.isUserAllAccess = false;
            this.isUserProfile = false;
            this.isUserProfileAll = false;
            this.isUserPermSetGrp = false;
            this.isUserpermSetGrpAll = false
        }else if(this.permissionSetGroupValue != 'All' && this.permissionSetGroupValue != 'None'){
            this.handlePermissionHandlerCall(this.selectedApiName, '', '', '', '', '', this.permissionSetGroupValue); 
            if(this.selectedApiName.length > 1){
                this.isUserpermSetGrpAll = true
                this.isUserPermSetGrp = false;
            }else if(this.selectedApiName == 1){
                this.isUserPermSetGrp = true;
                this.isUserPermSetGrpAll = false
            }
            this.isUserAll = false;
            this.isUserAllAccess = false;
            this.isUserPermSet = false;
            this.isUserPermSetAll = false;
            this.isUserProfile = false;
            this.isUserProfileAll = false
        }
     }

    }
    //This is helper method to blur the custom Input search with combobox event in order to close the listbox
    handleInputBlur(){
        setTimeout(() => {
            if (!this.isDropdownFocused) {
                this.showPermissions = false;
            }
            this.isInputFocused = false;
        }, 100);
    }
    //This is Helper Method in order to prevent Input Blur if the list box is focused
     handleDropdownFocus() {
        this.isDropdownFocused = true;
    }
    //This is helper method to blur the custom listbox event in order to close the listbox
    handleDropdownBlur() {
        setTimeout(() => {
            if (!this.isInputFocused) {
                this.showPermissions = false;
            }
            this.isDropdownFocused = false;
        }, 100);
    }
    //This Method handles the selected User Permissions change based on selections
    handleUserPermChanges(event) {
        this.disableSearch = false;
        if (event.target.dataset.index === '0') {  
            this.selectedPermissions = this.selectedPermissions.map((perm, index) => {
                return { ...perm, checked: index === 0 ? event.target.checked : false };
            });
        } else {
            this.selectedPermissions = this.selectedPermissions.map((perm, index) => {
                if (index === 0) {
                    return { ...perm, checked: false };
                } else if (index === parseInt(event.target.dataset.index, 10)) {
                    return { ...perm, checked: event.target.checked };
                }
                return perm;
            });
        }
        let selectedApi = [];
        if(event.target.name != 'All'){
            this.selectedPermissions.forEach(selectedPerm=>{
                if (selectedPerm.checked) {  
                    selectedApi.push(selectedPerm.value);
                }

            })
        }
        else{
            this.selectedPermissions.forEach(selectedPerm=>{
                if (selectedPerm.value != 'All') {  
                    selectedApi.push(selectedPerm.value);
                }

            })
        }
        this.selectedApiName = selectedApi;
    }
    //Used to handle the origin for user and object and field permissions
    handlePermissionOrigin(event){
        this.profileName = [];
        this.permSetName = [];
        this.permSetGrpName = [];
        this.isProfile = false;
        this.isPermSet = false;
        this.isPermSetGrp = false;
        this.showSpinner = true;
        if(this.isUser == true){  
            getUserPerm({userId: event.target.dataset.id,perms: this.selectedApiName})
            .then(res=>{
                console.log('res'+ JSON.stringify(res));
                this.profileName = res['Profile'] ? res['Profile'][0] : '';
                this.isProfile = this.profileName && this.profileName.length > 0 ? true : false;
                this.permSetName = res['PermissionSet'];
                this.isPermSet = this.permSetName && this.permSetName.length > 0 ? true : false;
                this.permSetGrpName = res['Group'];
                this.isPermSetGrp = this.permSetGrpName && this.permSetGrpName.length > 0 ? true : false;
                this.showSpinner = false;
                this.showPopOver = true;
            }).catch(err=>{
                console.log('handlePermissionOrigin err : ', JSON.stringify(err));
            })
        }
        if(this.isObject == true){
            this.getObjOrFieldPerm(this.userObjectValue, this.objectPermissionValue ,this.fieldValue, event.target.dataset.id);          
        }
        if(this.isField == true){
            this.getObjOrFieldPerm(this.objectValue, this.fieldPermissionValue, this.fieldValue, event.target.dataset.id)            
        }  
    }
    getObjOrFieldPerm(objName,permType,fieldName,userId){
        getObjOrFieldPerm({objName:objName, permType:permType , fieldName:fieldName,userId:userId})
        .then(res=>{
            this.profileName = res['Profile'] ? res['Profile'][0] : '';
            this.isProfile = this.profileName && this.profileName.length > 0 ? true : false;
            this.permSetName = res['PermissionSet'];
            this.isPermSet = this.permSetName && this.permSetName.length > 0 ? true : false;
            this.permSetGrpName = res['Group'];
            this.isPermSetGrp = this.permSetGrpName && this.permSetGrpName.length > 0 ? true : false;
            this.showSpinner = false;
            this.showPopOver = true;
        }).catch(err=>{
            console.log('handlePermissionOrigin err : ', JSON.stringify(err));
        })
    }
    //This Method handles the Permission origin close popover
    handleClosePopover() {
        this.showPopOver = false;
    }
    //This Method is used to remove the selectedAccess
    handleRemoveSelectedAccess(event){
        this._userPermissionOptions = this._userPermissionOptions.map(userPerm=>{
            if(userPerm.value == event.target.name){
                userPerm.isClicked = false;
            }
            return userPerm;
        })
        this.selectedPermissions = this.selectedPermissions.filter(p => p.value !== event.target.name);
        this.isSelected = this.selectedPermissions.length > 0 ? true : false;
        this.showLimitMessage = this.selectedPermissions.length <= 4? false :true;
    }

    // Implement debouncing for search
    handleSearch(event) {
        clearTimeout(this.#searchTimeout);
        this.#searchTimeout = setTimeout(() => {
            this.filterData(event.target.value);
        }, CONSTANTS.DEBOUNCE_DELAY);
    }

    // Implement memoization for expensive calculations
    filterData(searchTerm) {
        const cacheKey = `search_${searchTerm}`;
        if (this.#cachedData?.[cacheKey]) {
            return this.#cachedData[cacheKey];
        }

        const filtered = this.data.filter(/* filtering logic */);
        this.#cachedData[cacheKey] = filtered;
        return filtered;
    }
}