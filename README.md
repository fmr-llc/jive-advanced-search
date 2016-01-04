Jive - Search Widget
=======================

The Search widget is an alternate to the standard Jive search. The standard search allows for a global search, or searching the current container (Group, Space, etc.). This is a [Jive](https://community.jivesoftware.com/welcome) HTML widget project that provides a more configurable search that allows multiple configurable containers to be searched. This widget uses the Jive V3 search APIs.


Prerequisite
------------

The [Content Lookup](http://www.github.com/) widget installation has essential parts of setting up this widget project.  Make sure to install this widget prior to the accordion installation.


Upload Libraries
----------------

1. Extract the search widget zip archive to your local computer.
2. Log into your Jive community.
3. Navigate to the upload location for your library files.
4. Create an Uploaded File in the Library location of your Jive community.  Drag the file "search_widget.css" to the file section of the upload.  Set the file name to "Search Widget CSS Library", put a description of your choosing, tag it, set the authors, and make sure it is being published to the correct Library location.  Click Publish.
5. Create another Uploaded File in the Library location of your Jive community.  Drag the file "search_widget.js" to the file section of the upload.  Set the file name to "Search Widget JavaScript Library", put a description of your choosing, tag it, set the authors, and make sure it is being published to the correct Library location.  Click Publish.
6. Create another Uploaded File in the Library location of your Jive community.  Drag the file "search_widget_builder.css" to the file section of the upload.  Set the file name to "Search Widget Builder CSS Library", put a description of your choosing, tag it, set the authors, and make sure it is being published to the correct Library location.  Click Publish.
7. Create another Uploaded File in the Library location of your Jive community.  Drag the file "search_widget_builder.js" to the file section of the upload.  Set the file name to "Search Widget Builder JavaScript Library", put a description of your choosing, tag it, set the authors, and make sure it is being published to the correct Library location.  Click Publish.


Update Library Loader
---------------------

1. Use the Content Lookup widget to search for "Library Loader".  Click the link to the file in the results.  If it is not found, contact your administrator and review the prerequisite.
2. Download a copy of the "Library Loader" file from your community.  Open it for editing.
3. Go back to the Content Lookup widget and search for "Search Widget".  You should see the four library files you uploaded to your community above.
4. Find the search result for "Search Widget CSS Library" and copy its Content ID.  It should be a number like 694224.
5. Update the library_loader.js file line for "search_widget.css" and update the content ID variable (it should be 0 before updating) to the Content ID from step 4.  The result should look similar to:

```
	libraries['search_widget.css'] = { contentID: '694224' };
```

6. Find the search result for "Search Widget JavaScript Library" and copy its Content ID.  It should be a number like 694225.
7. Update the library_loader.js file line for "search_widget.js" and update the content ID variable (it should be 0 before updating) to the Content ID from step 6.  The result should look similar to:

```
	libraries['search_widget.js'] = { contentID: '694225' };
```

8. Find the search result for "Search Widget Builder CSS Library" and copy its Content ID.  It should be a number like 694226.
9. Update the library_loader.js file line for "search_widget_builder.css" and update the content ID variable (it should be 0 before updating) to the Content ID from step 8.  The result should look similar to:

```
	libraries['search_widget_builder.css'] = { contentID: '694226' };
```

10. Find the search result for "Search Widget Builder JavaScript Library" and copy its Content ID.  It should be a number like 694227.
11. Update the library_loader.js file line for "search_widget_builder.js" and update the content ID variable (it should be 0 before updating) to the Content ID from step 10.  The result should look similar to:

```
	libraries['search_widget_builder.js'] = { contentID: '694227' };
```

12. Save the changes to the library_loader.js file on your computer.
13. Edit the "Library Loader" uploaded file in your Jive community.
14. Drag the updated file from your computer to the file section of the uploaded file.  Click Publish.

You have now updated the Library Loader in your Jive community with the library files needed to run the search widget builder and resulting widgets.


Install the Search Widget Builder application
---------------------------------------------------

1. Use the Content Lookup widget to search for "Library Loader" again.  Copy the Content ID.
2. Look in the search widget archive on your computer and edit the "search_widget_builder.html" file.
3. Find the library_loader_content_id and replace the zero in the quotes with the Content ID copied in step 1.  The result should look similar to:

```
	var library_loader_content_id = "694223";
```

4. Save the edit to the "search_widget_builder.html" file on your computer.
6. Go to the site you want to put the Search Widget Builder application in your community, and go to the Overview page.
7. Manage the Overview page, and drag a new HTML widget onto the page.
8. Edit the new HTML Widget.
9. Copy the updated code from "search_widget_builder.html" and paste it into the "Your HTML" entry field in the new widget.
10. Click "Save Properties".
11. Click "Publish Layout".


Usage
-----

1. Go to the Search Widget Builder application.
2. Paste the URL to the first location you want to include in your search widget.  Click Add.  The URL will be checked for a valid location that can be searched, and also check for child containers within it.  If child containers are detected, then the builder will give the option of including them in the search as well.  This makes it easy to add entire space branches to the search.
3. You are presented with the list of containers that will e included in the search.  You can now add another place to search by clicking Add Another URL, Remove one of the places in the list by highlighting it and clicking Remove, or click Next to continue with the configuration.
4. The next screen is the styling screen, where you can select the way the search entry looks and the number of items returned in the search.  When satisfied, clik Finished.
5. The search widget code will be generated and highlighted in the code box.  Press Ctl-C to copy it to the clipboard.
6. Go to the Overview page you want the search widget.
7. Manage the Overview page.
8. Drag a new HTML Widget into one of the columns on the page.
9. Edit the widget and paste the code from the previous section.
10. Click Save Properties.
11. Publish the page.

Once the search widgeet is set up and operational, users can use the search box just like the traditional Jive search.  The difference is that only the configured containers will be searched with this widget.

At this time, the search widget only returns content.  It does not return people or locations.  This may be added later if reuests for that functionality are made.


Issues
------

If your widget is not working as expected, please check out [Issues](docs/issues.md)


Contributing
------------

If you would like to contribute to this project, please check out [Contributing](docs/contributing.md)


License
-------

(c) 2015 Fidelity Investments
Licensed under the Apache License, Version 2.0
