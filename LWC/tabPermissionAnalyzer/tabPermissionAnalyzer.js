//This Component is used to handle Tab Setting for Profile PermissionSet
//This Component is used as child Component under PermissionAnalyzer
import {LightningElement,  api, track} from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import getProfileOrPermSetTabVisibility from '@salesforce/apex/TabPermissionAnalyzerServer.getProfileOrPermSetTabVisibility';
import updateProfileTabVisibilities from '@salesforce/apex/TabPermissionAnalyzerServer.updateProfileTabVisibilities';
import updatePermissionSetTabVisibilities from '@salesforce/apex/TabPermissionAnalyzerServer.updatePermissionSetTabVisibilities';
import { debounce } from 'c/utils';

export default class TabPermissionAnalyzer extends LightningElement {
    @api permApiName;
    @api type;
    @api csnOnlyUser;
    @api profileType;
    @api permId;
    @api selecteduserLabel;
    @api userId;
    showSpinner = false;
    @track tabList = [];
    isTab = false;
    @track lastSavedTab = [];
    @track hasTab = true;
    isProfile = false;
    isPermissionSet = false;
    @track searchTabKey = '';
    enableEdit = false;
    isEditMode = false;
    hasEditAccess = false;
    isUpdateEnabled = true;
    changedTablist = [];
    @api userValue;
    @api userValueLength;
    isUsersTable = false;
    isCreatePermissionSet = true;
    isConfirm = false;
    permSetList = [];
    profToPermSet = [];
    isNewPermSet = false
    isExistingPermissionSet = false
    @track state = {
        tabs: new Map(),
        searchKey: '',
        loading: false,
        error: null
    };
    tabCache = new Map();
    searchCache = new Map();
    handleSearchKeyChange = debounce((event) => {
        this.filterTabs(event.target.value);
    }, 300);
    @api
    get permSetLists() {
        return this.permSetList;
    }
    set permSetLists(value) {
        this.permSetList = JSON.parse(JSON.stringify(value));
    }
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
    //From this connectedCallBack Method is to handle Profile and permissionset setting handler
    connectedCallback() {
        this.showSpinner = true;
        this.getProfileTabSetting(this.permApiName, this.type);
        if (this.type == 'Profile') {
            this.isProfile = true;
            this.isPermissionSet = false;
            if (this.csnOnlyUser == true) {
                this.isEditMode = true;
            } else {
                this.isEditMode = false;
            }
        } else {
            this.showSpinner = true;
            this.isProfile = false;
            this.isPermissionSet = true;
            if (this.profileType == 'Standard') {
                this.isEditMode = true;
                this.enableEdit = true;
            } else {
                this.isEditMode = false;
                this.enableEdit = true;
            }
        }
    }
    //This getter funtion we handled search tab settings in UI level.
    get filteredTabList() {
        if (this.searchTabKey) {
            return this.tabList.filter(tab => tab.Label.toLowerCase().includes(this.searchTabKey.toLowerCase()));
        }
        return this.tabList;
    }
    //This Method is used to handle Tab Setting Search Input
    handleSearchKeyChange(event) {
        if (event.target.label == 'Search Tab Setting') {
            this.searchTabKey = event.target.value;
            this.hasTab = this.filteredTabList.length > 0 ? true : false
        }
    }
    //This Method is used to Get the Profile and Permissionset Tab Settings
    getProfileTabSetting(profileName, type) {
        getProfileOrPermSetTabVisibility({
                profileOrPermissionSetName: profileName,
                typeProfileOrPermissionSet: type
            })
            .then(res => {
                console.log('check tab res' + JSON.stringify(res));
                this.showSpinner = false;
                this.tabList = res;
                if (type == 'Profile') {
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
                } else {
                    this.tabList = res.map(item => {
                        return {
                            Label: item.Label,
                            name: item.Name,
                            visibility: item.Visibility === 'Visible',
                            availability: item.Visibility === 'Visible' || item.Visibility === 'Available'
                        };
                    }).sort((a, b) => {
                        if (a.visibility && a.availability && (!b.visibility || !b.availability)) {
                            return -1;
                        }
                        if ((!a.visibility || !a.availability) && b.visibility && b.availability) {
                            return 1;
                        }
                        if (a.availability && !a.visibility && (!b.availability || b.visibility)) {
                            return -1;
                        }
                        if ((!a.availability || b.visibility) && b.availability && !b.visibility) {
                            return 1;
                        }
                        return 0;
                    });
                }
                this.isTab = this.tabList.length > 0 ? true : false;
                this.lastSavedTab = JSON.parse(JSON.stringify(this.tabList));
            }).catch(err => {
                console.error('Error in getProfileTabSetting: ', err);
                this.showSpinner = false;
                throw err;
            })
    }
    //This Method is used to initiate the tab setting edit for Profile and PermissionSet
    handleTabEdit() {
        if (this.type == 'Profile') {
            this.enableEdit = true;
            this.hasEditAccess = true;
        } else {
            this.enableEdit = false;
            this.hasEditAccess = true;
            this.isEditMode = true;
        }
    }
    //This Method is used to cancles based on respective cancel buttons
    handleCancel(event) {
        if (event.target.name == 'Tab Cancel') {
            this.isUpdateEnabled = true;
            this.changedTablist = [];
            this.profToPermSet = [];
            this.tabList = JSON.parse(JSON.stringify(this.lastSavedTab));
            if (this.type == 'Profile') {
                this.hasEditAccess = false;
                this.enableEdit = false;
            } else {
                this.enableEdit = true;
                this.hasEditAccess = false;
                this.isEditMode = false;
            }
        }
        if (event.target.name == 'ConfirmCancel') {
            this.isConfirm = false;
        }
        if (event.target.name == 'user cancel') {
            this.isUsersTable = false;
            this.isConfirm = true;
        }
        if (event.target.name == 'Existing PermissionSet cancel') {
            this.isExistingPermissionSet = false
        }
    }
    //This Methos is used to handle Tab Changes for Profile or PermissionSet
    handleTabChange(event) {
        if (this.type == 'Profile') {
            this.isUpdateEnabled = false;
            this.tabList = this.tabList.map(tab => {
                if (tab.Name === event.target.dataset.name) {  
                    tab.Visibility = event.target.value;
                    if (!this.changedTablist.includes(tab)) {
                        this.changedTablist.push(tab);
                    }
                }
                return tab;
            });
            console.log('check changed tab', JSON.stringify(this.changedTablist));
        } else {
            this.isUpdateEnabled = false;
            const fieldName = event.target.dataset.fieldapi;
            const field = event.target.dataset.field;
            const isChecked = event.target.checked;
            let tabSetting = this.tabList.find(item => item.name === fieldName);
            if (!tabSetting) {
                tabSetting = {
                    name: fieldName,
                    visibility: false,
                    availability: false
                };
                this.tabList.push(tabSetting);
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
            const index = this.changedTablist.findIndex(item => item[fieldName] !== undefined);
            if (index > -1) {
                this.changedTablist[index] = {
                    [fieldName]: newValue
                };
            } else if (newValue !== null) {
                this.changedTablist.push({
                    [fieldName]: newValue
                });
            } else {
                this.changedTablist.push({
                    [fieldName]: null
                });
            }
            console.log('Final Tab Setting:', JSON.stringify(this.changedTablist));
        }
    }
    //This Method is used to update tab Settings for Profile and PermissionSet
    handleUpdate() {
        this.isConfirm = true;
        if (this.type === 'Profile') {
            this.profToPermSet = this.changedTablist.map(changeTab => {
                let obj = {};
                if (changeTab.Visibility === 'DefaultOn') {
                    obj[changeTab.Name] = 'Visible';
                }
                const lastSavedTab = this.lastSavedTab.find(e => e.tab === changeTab.tab);
                if (changeTab.Visibility === 'DefaultOff' && lastSavedTab && lastSavedTab.Visibility === 'Hidden') {
                    obj[changeTab.Name] = 'Available';
                }
                return obj;
            }).filter(tabObj => Object.keys(tabObj).length > 0);
            this.isCreatePermissionSet = this.profToPermSet.length > 0 ? false : true;
        }
    }
    //This Method is used to handle User Modal
    handleOpenUserModal() {
        this.isConfirm = false;
        this.isUsersTable = true;
    }
    //This Method is used to directly update the TabSettings for Profile and PermissionSet through server call
    handleConfirm() {
        this.showSpinner = true
        if (this.type == 'Profile') {
            updateProfileTabVisibilities({
                    profileNames: this.permApiName,
                    tabToUpdate: this.changedTablist
                })
                .then(res => {
                    console.log('res', res);
                    this.lastSavedTab = JSON.parse(JSON.stringify(this.tabList));
                    this.handleShowToast('Successfully updated tab settings', 'Success', 'success');
                    this.resetChanges();
                }).catch(err => {
                    this.tabList = JSON.parse(JSON.stringify(this.lastSavedTab));
                    let errorMessage = err.body.message;
                    let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                    this.handleShowToast(extractedMessage, 'Error', 'error');
                    this.resetChanges();
                })
        } else {
            updatePermissionSetTabVisibilities({
                    tabSettingsJson: JSON.stringify(this.changedTablist),
                    persetname: this.permApiName
                })
                .then(res => {
                    console.log('res', res);
                    res.forEach(updatedItem => {
                        this.tabList = this.tabList.map(tab => {
                            if (tab.name === updatedItem.tab) {
                                if (updatedItem.visibility === 'Visible') {
                                    tab.visibility = updatedItem.visibility;
                                    tab.availability = updatedItem.visibility;
                                }
                                if (updatedItem.visibility === 'Available') {
                                    tab.availability = updatedItem.visibility;
                                }
                            }
                            return tab;
                        });

                    });
                    this.lastSavedTab = JSON.parse(JSON.stringify(this.tabList));
                    this.handleShowToast('Successfully updated tab settings', 'Success', 'success');
                    this.resetChanges();
                }).catch(err => {
                    this.tabList = JSON.parse(JSON.stringify(this.lastSavedTab));
                    let errorMessage = err.body.message;
                    let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                    this.handleShowToast(extractedMessage, 'Error', 'error');
                    this.resetChanges();
                })
        }
    }
    //This Method is used to handle Existiong PermissionSet initiation
    handleExistingPermissionSet() {
        this.isExistingPermissionSet = true;
    }
    //This Method is used to handle update Permissionset which we make in profile 
    handleUpdateExistingPermissionSet(event) {
        this.showSpinner = true;
        let permSet = this.permSetList.find(e => e.Id == event.target.dataset.id);
        let selectedPermApiName = permSet.NamespacePrefix != null && permSet.NamespacePrefix != '' ? permSet.NamespacePrefix + __ + permSet.Name : permSet.Name
        updatePermissionSetTabVisibilities({
                tabSettingsJson: JSON.stringify(this.profToPermSet),
                persetname: selectedPermApiName
            })
            .then(res => {
                this.tabList = JSON.parse(JSON.stringify(this.lastSavedTab));
                this.handleShowToast(`Successfully updated tab settings changes to Existing PermissionSet - ${permSet.Name}`, 'Success', 'success');
                this.resetChanges();
            }).catch(err => {
                let errorMessage = err.body.message;
                let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                this.handleShowToast(extractedMessage, 'Error', 'error');
                this.tabList = JSON.parse(JSON.stringify(this.lastSavedTab));
                this.resetChanges();
            })
    }
    //This Method is used to handle Profile to Create New PermissionSet open popup 
    handleCreateNewPermissionSet() {
        this.isNewPermSet = true;
    }
    //This Method is used to handle Profile to Create New PermissionSet close popup
    closeCreateModal() {
        this.isNewPermSet = false;
    }
    //This Method is to handle Custom Event which fire from child
    handleCustomEvent(event) {
        this.resetChanges();
        this.tabList = JSON.parse(JSON.stringify(this.lastSavedTab))
        this.permSetList.push(event.detail);
        this.dispatchEvent(new CustomEvent("newpermissionsettoadd", {
            detail: event.detail,
            bubbles: true,
            composed: true,
        }));
    }
    //This Method is used to reset all the changes
    resetChanges() {
        this.isExistingPermissionSet = false;
        this.isConfirm = false;
        this.showSpinner = false;
        this.isUpdateEnabled = true;
        this.changedTablist = [];
        this.profToPermSet = [];
        this.isNewPermSet = false;
        this.isCreatePermissionSet = true;
        if (this.type == 'Profile') {
            this.hasEditAccess = false;
            this.enableEdit = false;
        } else {
            this.enableEdit = true;
            this.hasEditAccess = false;
            this.isEditMode = false;
        }
    }
    //This Method is used to Handle Showtoast event
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
    filterTabs(searchTerm) {
        const cacheKey = searchTerm.toLowerCase();
        if (this.searchCache.has(cacheKey)) {
            this.filteredTabList = this.searchCache.get(cacheKey);
            return;
        }

        const filtered = this.tabList.filter(tab => 
            tab.Label.toLowerCase().includes(cacheKey)
        );

        this.searchCache.set(cacheKey, filtered);
        this.filteredTabList = filtered;
        this.hasTab = filtered.length > 0;
    }
    processTabUpdates(tabs, batchSize = 50) {
        let processed = 0;
        const total = tabs.length;

        const processBatch = () => {
            const batch = tabs.slice(processed, processed + batchSize);
            batch.forEach(this.processTab);
            processed += batch.length;

            if (processed < total) {
                requestAnimationFrame(processBatch);
            }
        };

        requestAnimationFrame(processBatch);
    }
    @api
    handleError(error) {
        console.error('Tab Permission Error:', error);
        this.showErrorToast(error);
        this.resetState();
    }
    measureOperation(operation, label) {
        performance.mark(`${label}-start`);
        operation();
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
    }
    disconnectedCallback() {
        this.clearCaches();
    }
}