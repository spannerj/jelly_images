var errorArray = [];

g_FolderCheck = {
    
    folderCheck: function(schoolPath, imageCount){         
        return folder_check (schoolPath, imageCount);
    }
};

function folder_check(schoolPath, imageCount){

    var editedFolder = new Folder(schoolPath + '\\Edited');
    
    //exit if no folder set
    if (editedFolder == null)
    {
         return;
    }
    
    //remove any existing errors folder
    var f = new File(schoolPath + '//' + 'errors.txt');    
    f.remove();
    
    //get folders under selected folder
    var classArray = editedFolder.getFiles(onlyFolders); 
    
    //loop over each folder checking for presence of JPG folder with 6 images inside
    for (var i = 0; i < classArray.length; i++)  
    { 
        //  ignore files and loop through folders recursively with the current folder as an argument  
        if (classArray[i] instanceof Folder)  
        {  
            //loop through class folder getting each pupil
            var pupilArray = classArray[i].getFiles(onlyFolders);
           
            //loop over each folder checking for presence of JPG folder with 6 images inside
            for (var j = 0; j < pupilArray.length; j++)  
            { 
                if (pupilArray[j] instanceof Folder)
                {            
                    var folderName = pupilArray[j].name;

                    //pics folder found look for JPEG folder inside
                    var picFolder = new Folder(pupilArray[j]);
                    var jpgFolder = picFolder.getFiles ("JPEG");    
                    
                    //no jpg folder so add to error array
                    if (jpgFolder == '')
                    {
                        errorArray.push(folderName+ " - missing jpg folder");
                    } 
                    else
                    {
                        //jpg folder found so now count the jpgs
                        if ( checkFolderCount(jpgFolder, imageCount) )
                        {
                            errorArray.push(folderName + " - incorrect number of files in jpg folder");
                        }    
                    
                        //jpg folder found so now count the jpgs
                        if ( checkFolderCount(picFolder, imageCount) )
                        {
                            errorArray.push(folderName + " - incorrect number of files in edited folder");
                        }  
                    
                        //sims file check - loop through jpg  folder looking for a file with *-1.jpg/*-01.jpg
                        if ( !checkSimsFileExists(jpgFolder) )
                        {
                            errorArray.push(folderName + " - missing a suitable sims file");
                        }  
                    }
                } //end if instance of pupil folder
            } //loop pupil array
        } //end if instance of class folder
    } //end for

    //if errors have been found show message
    if (errorArray.length > 0)
    {
        var msg = 'The folowing folders did not process due to missing JPEG folder, incorrect number of files or missing sims files: \n';
        for (var i = 0; i < errorArray.length; i++) 
        {
            //store file name in message ready for alert and remove all spaces
            msg = msg + '\n' + errorArray[i].replace(/%20/g,' ');
            //add file name to the error file
            writeToErrorFile (errorArray[i].replace(/%20/g,' '), schoolPath);
        }

        alert(msg);

        return true
    }
    else
    {
        return false
    }
};

function checkSimsFileExists(schoolPath){          
    // Create new folder object based on path string  
    var folder = new Folder(schoolPath);  
    var filesArray = new Array();

    // Get all files in the current folder  
    var files = folder.getFiles();  

    // Loop over the files in the files object  
    for (var i = 0; i < files.length; i++)  
    {  
        // Check if the file is an instance of a file   
        if (files[i] instanceof File)  
        {   
            // Convert the file object to a string for matching purposes (match only works on String objects)  
            var fileString = String(files[i]);  

            if ( fileString.match(/-(0?)1.(jpg)$/i) || fileString.match(/-(0?)1.(CR2)$/i) ) 
            {
                //sims file found
                return true
            }
        }      
    } //end for

    //missing sims file
    return false
} //end function

function checkFolderCount(schoolPath, imageCount){          
    // Create new folder object based on path string  
    var folder = new Folder(schoolPath);  
    var filesArray = new Array();

    // Get all files in the current folder  
    var files = folder.getFiles();  

    // Loop over the files in the files object  
    for (var i = 0; i < files.length; i++)  
    {  
        // Check if the file is an instance of a file   
        if (files[i] instanceof File)  
        {   
            // Convert the file object to a string for matching purposes (match only works on String objects)  
            var fileString = String(files[i]);  

            // Check if the file contains the right extension  
            if ( fileString.match(/.(jpg)$/i) || fileString.match(/.(CR2)$/i) )  
            {  
                // Place the image in the template  
                filesArray.push(fileString);
            }  
        }      
    } //end for

    //if count doesn't = imageCount return a false
    if ( filesArray.length != imageCount ){
        return true
    }
    else
    {
        return false
    }
} //end function

//return true if the file is a folder otherwise return false
function onlyFolders(f) {
  if (f.constructor.name == "File") {
    return false;
  } else {
    return true;
  }
} 

//write text to a file at a specified location, create file if it doesn't already exist
function writeToErrorFile(text, logPath) {
    path = logPath + "\\" + "errors.txt" 
	file = new File(path);
	file.encoding = "UTF-8";
	if (file.exists) {
		file.open("e");
		file.seek(0, 2);
	}
	else {
		file.open("w");
	}
	file.write(text + "\r\n"); 
	file.close();
}