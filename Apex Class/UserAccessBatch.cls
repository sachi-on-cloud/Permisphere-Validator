//This batch class is used to retrieve current user's detail.
global with sharing class UserAccessBatch implements Database.Batchable<SObject> {
    private static final String ERROR_MESSAGE = 'Error executing batch: ';
    private List<String> failedRecords;
    
    public UserAccessBatch() {
        this.failedRecords = new List<String>();
    }
    
    //This start method retrieves current users data.
    global Database.QueryLocator start(Database.BatchableContext bc) {
        // Improve query to be more specific and add error handling
        try {
            return Database.getQueryLocator([
                SELECT Id, Username, Email 
                FROM User 
                WHERE IsActive = true 
                LIMIT 50000
            ]);
        } catch(Exception e) {
            handleError('Error in start method', e);
            return null;
        }
    }
    //This execute method calls queueable apex.
    global void execute(Database.BatchableContext bc, List<User> scope) {
        try {
            if(scope != null && !scope.isEmpty()) {
                for(User usr : scope) {
                    try {
                        System.enqueueJob(new CreateConnectedAppQueueable(
                            UserInfo.getSessionId(), 
                            usr.Username, 
                            usr.Email
                        ));
                    } catch(Exception e) {
                        failedRecords.add(usr.Id);
                        handleError('Error processing user: ' + usr.Username, e);
                    }
                }
            }
        } catch(Exception e) {
            handleError('Error in execute method', e);
        }
    }
    
    global void finish(Database.BatchableContext bc) {
        try {
            if(!failedRecords.isEmpty()) {
                // Log failed records or send notification
                logFailedRecords();
            }
        } catch(Exception e) {
            handleError('Error in finish method', e);
        }
    }
    
    private void handleError(String message, Exception e) {
        String errorMsg = message + ': ' + e.getMessage();
        System.debug(LoggingLevel.ERROR, errorMsg);
        // Consider implementing custom error logging
    }
    
    private void logFailedRecords() {
        // Implement failed records logging logic
    }
}