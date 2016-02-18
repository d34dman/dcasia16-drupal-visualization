1. USAGE
  Visit Github Page http://d34dman.github.io/dcasia16-drupal-visualization/ and
  click on project specific link listed there to access visualization.


2. ADVANCED USAGE (hosting it yourself)

  1. Obtaining the project data in json format.

    1. Set up the Drupal project https://github.com/d34dman/drupal-project-health-checker
       to scrap the data using Drupal.org's node API.
    2. Take snapshots of the projects you are interested in.
    3. Once the snapshot is ready you should be able to view the project details
       on http://www.example.com/projecthealth/view/<project-name>/<snapshot id>
    4. For the above snapshot you can find the data in json format at url
       http://www.example.com/projecthealth/data/<project-name>/<snapshot id>

  2. Using the data obtained from scrapper

    1. Save the json data into /data folder of this project.
       Name it <project-name>.json
    2. Visiting /visualization?project=<project-name> should show the
       visualization for the <project-name>

  3. NOTE
     Project uses various libraries through cdn.
     So a working internet connection is required.

3. CREDITS
  1. THEME:
    1. Bootstrap Theme
    2. AdminLTE Dashboard Theme
  2. LIBRARIES:
    1. jquery & jquery UI
    2. d3js
  3. Hosting and Version control: GitHub
