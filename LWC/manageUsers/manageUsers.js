//This component is used for editing users,activating&deactivating users,editing user assignment.
import {LightningElement,track,wire,api} from 'lwc';
import getAllUsers from '@salesforce/apex/ManageCloneUser.getAllUsers';
import userActivation from '@salesforce/apex/ManageCloneUser.userActivation';
import {NavigationMixin} from 'lightning/navigation';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
export default class ManageUsers extends NavigationMixin(LightningElement) {

    isUser = false;
    @track sortBy;
    @track sortDirection;
    @track userList = [];
    @api spinnerValue;
    isCreateModal = false;
    userId;
    isActive;
    isActivateConfirmMessage = false;
    isDeActivateConfirmMessage = false;
    userName;
    @track updatedOtherRecords = [];
    @track searchUserName = '';
    @track wiredResult = [];
    @track isUserRecord = false;
    searchTimeout;
    // Cache for filtered results
    filteredResultsCache;
    lastSearchTerm;
    // Cache for sorted results
    sortedResultsCache = new Map();

    userColumndropdown = [{
            label: 'Name',
            fieldName: 'Name',
            sortable: true
        },
        {
            label: 'Email',
            fieldName: 'Email',
            sortable: true
        },
        {
            label: 'License',
            fieldName: 'licenseName',
            sortable: true
        },
        {
            label: 'Is Active',
            fieldName: 'IsActive',
            sortable: true
        },
        {
            label: 'Edit',
            type: 'button-icon',
            typeAttributes: {
                iconName: 'utility:edit',
                name: 'edit',
                variant: 'border-filled',
                alternativeText: 'Edit',
                title: 'Edit'
            }
        },
        {
            label: 'Status',
            type: 'button',
            fieldName: 'buttonLabel',
            typeAttributes: {
                label: {
                    fieldName: 'buttonLabel'
                },
                name: 'active_Condition',
                variant: {
                    fieldName: 'buttonVariant'
                }
            }
        },
        {
            label: 'Assignments',
            type: 'button',
            typeAttributes: {
                label: 'Edit Assignment',
                name: 'editAssignment',
                variant: 'neutral',
                disabled: {
                    fieldName: 'editAssign'
                }
            }
        }
    ]

    // Memoize row action handlers
    actionHandlers = new Map([
        ['edit', this.handleEdit.bind(this)],
        ['active_Condition', this.handleActiveCondition.bind(this)],
        ['editAssignment', this.handleEditAssignment.bind(this)]
    ]);

    // This method retrieves all users, formats the user list with additional properties like licenseName, buttonLabel, and buttonVariant, and filters the users while handling errors and managing spinner visibility.
    @wire(getAllUsers)
    wiredUsers({
        error,
        data
    }) {
        this.wiredResult = data;
        if (data) {
            console.log('Custom Event Spinner');
            console.log('OUTPUT : User List', JSON.stringify(data));
            this.userList = data.map(user => ({
                ...user,
                licenseName: user.Profile?.UserLicense?.Name || '',
                buttonLabel: user.IsActive ? 'Deactivate' : 'Activate',
                buttonVariant: user.IsActive ? 'destructive' : 'brand',
                editAssign: user.IsActive ? false : true
            }));
            this.filterUsers();
            this.sortedResultsCache.clear();
            this.filteredResultsCache = null;
        } else if (error) {
            console.error(error);
            this.dispatchSpinnerEvent(false);
        }
    }
    //This method dispatches a custom event named spinnerchange with a specified value to toggle spinner visibility.
    dispatchSpinnerEvent(value) {
        const spinnerEvent = new CustomEvent('spinnerchange', {
            detail: value
        });
        this.dispatchEvent(spinnerEvent);
    }
    //This method updates the searchUserName property with the lowercase value of the input and triggers the filterUsers method to apply the search filter.
    handleSearchChange(event) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.searchUserName = event.target.value.toLowerCase();
            this.filterUsers();
        }, 300);
    }
    //This method filters the userList based on the searchUserName input and updates the list with relevant user details, then triggers the spinner event.
    filterUsers() {
        // Check cache first
        if (this.lastSearchTerm === this.searchUserName && this.filteredResultsCache) {
            this.userList = this.filteredResultsCache;
            return;
        }

        this.userList = this.wiredResult.map(user => ({
            ...user,
            licenseName: user.Profile?.UserLicense?.Name || '',
            buttonLabel: user.IsActive ? 'Deactivate' : 'Activate',
            buttonVariant: user.IsActive ? 'destructive' : 'brand',
            editAssign: user.IsActive ? false : true
        })).filter(user =>
            user.Name.toLowerCase().includes(this.searchUserName)
        );

        // Cache the results
        this.filteredResultsCache = this.userList;
        this.lastSearchTerm = this.searchUserName;
        
        this.isUser = this.userList.length > 0;
        this.dispatchSpinnerEvent(false);
    }

    //This function will used to sort data by direction.
    doSorting(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }

    //Helper method for sorting data
    sortData(fieldName, sortDirection) {
        const cacheKey = `${fieldName}-${sortDirection}`;
        
        // Check cache first
        if (this.sortedResultsCache.has(cacheKey)) {
            this.userList = [...this.sortedResultsCache.get(cacheKey)];
            return;
        }

        let data = JSON.parse(JSON.stringify(this.userList));
        let keyValue = (a) => a[fieldName] || '';
        let isReverse = sortDirection === 'asc' ? 1 : -1;

        data.sort((x, y) => {
            x = keyValue(x);
            y = keyValue(y);
            return isReverse * ((x > y) - (y > x));
        });

        // Cache the sorted results
        this.sortedResultsCache.set(cacheKey, [...data]);
        this.userList = data;
    }
    //This method handles different row actions such as editing a user, editing assignments, and toggling user activation status with appropriate modal and confirmation message triggers.
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const handler = this.actionHandlers.get(actionName);
        
        if (handler) {
            handler(event.detail.row);
        }
    }
    //This method updates the user's activation status, modifies the user list accordingly, and displays a success or error toast, while managing confirmation message visibility.
    handleConfirmActivate() {
        this.spinnerValue = true;

        userActivation({
                userId: this.userId,
                isActive: this.isActive
            })
            .then((result) => {
                console.log(result);
                const updatedUserList = this.userList.map(user => {
                    if (user.Id === result.Id) {
                        console.log('before userToUpdate', JSON.stringify(user));
                        return {
                            ...user,
                            IsActive: result.IsActive,
                            buttonLabel: result.IsActive ? 'Deactivate' : 'Activate',
                            buttonVariant: result.IsActive ? 'destructive' : 'brand',
                            editAssign: result.IsActive ? false : true
                        };
                    }
                    return user;
                });
                this.userList = updatedUserList;

                const updatedWireList = this.wiredResult.map(user => {
                    if (user.Id === result.Id) {
                        console.log('before userToUpdate', JSON.stringify(user));
                        return {
                            ...user,
                            IsActive: result.IsActive,
                            buttonLabel: result.IsActive ? 'Deactivate' : 'Activate',
                            buttonVariant: result.IsActive ? 'destructive' : 'brand',
                            editAssign: result.IsActive ? false : true
                        };
                    }
                    return user;
                });
                this.wiredResult = updatedWireList;

                console.log('after userToUpdate', JSON.stringify(result));
                this.spinnerValue = false;
                this.handleShowToast('User Activated Successfully', 'Success', 'success');
            })
            .catch((error) => {
                console.error('Error in Updating Active Status', error);
                this.spinnerValue = false;
                let errorMessage = error.body.message;
                let extractedMessage = errorMessage.includes('first error:') ? errorMessage.split('first error:')[1].trim() : errorMessage;
                this.handleShowToast(extractedMessage, 'Error', 'error');
            });
        if (this.isActivateConfirmMessage == true) {
            this.isActivateConfirmMessage = false;
        }

        if (this.isDeActivateConfirmMessage == true) {
            this.isDeActivateConfirmMessage = false;
        }
    }
    //This method triggers a toast notification with the specified message, title, variant, and dismissible mode.
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
    //This method hides confirmation or edit modals based on the ariaLabel of the canceled event.
    handleCancel(event) {
        if (event.target.name == 'activateCancel') {
            this.isActivateConfirmMessage = false;
        }
        if (event.target.name == 'deActivateCancel') {
            this.isDeActivateConfirmMessage = false;
        }
        if (event.target.name == 'editCancel') {
            this.isUserRecord = false;
        }
    }

    //This function is used to close create modal.
    closeAssignment() {
        this.isCreateModal = false;
    }
    //This method updates the updatedOtherRecords array with the sliced records from the event detail if they are defined and not empty.
    updateHandler(event) {
        if (event.detail.slicedRecords != undefined && event.detail.slicedRecords.length > 0) {
            this.updatedOtherRecords = [...event.detail.slicedRecords];
        }
    }
    //This method updates the user's name and email in both userList and wiredResult, hides the user record modal, and shows a success toast message after saving the changes.
    handleSuccess(event) {
        this.spinnerValue = true;
        const savedFields = event.detail.fields;
        const savedEmail = savedFields.Email.value;
        const fullName = `${savedFields.FirstName.value} ${savedFields.LastName.value}`;
        const updatedUserList = this.userList.map(user => {
            if (user.Id === event.detail.id) {
                return {
                    ...user,
                    Name: fullName,
                    Email: savedEmail
                };
            }
            return user;
        });
        this.userList = updatedUserList;

        const updatedWireList = this.wiredResult.map(user => {
            if (user.Id === event.detail.id) {
                return {
                    ...user,
                    Name: fullName,
                    Email: savedEmail
                };
            }
            return user;
        });
        this.wiredResult = updatedWireList;
        this.isUserRecord = false;
        this.handleShowToast('User Edited Successfully', 'Success', 'success');
        this.spinnerValue = false;
    }

}