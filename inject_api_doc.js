const fs = require('fs');

let html = fs.readFileSync('API_Documentation.html', 'utf8');
let injectHTML = fs.readFileSync('doctor_apis_to_inject.html', 'utf8');

const sidebarFind = `    <div class="sidebar-section-title">External Utilities</div>
    <ul class="sidebar-menu">
      <li><a href="#s3-upload">AWS S3 File Upload</a></li>
    </ul>`;

const sidebarReplace = sidebarFind + `

    <div class="sidebar-section-title">Doctor Web App Services</div>
    <ul class="sidebar-menu">
      <li><a href="#doctor-auth">Auth &amp; Doctor Details</a></li>
      <li><a href="#doctor-appointments">Appointments</a></li>
      <li><a href="#doctor-prescriptions">Prescriptions &amp; Medicines</a></li>
      <li><a href="#doctor-lab">Lab Tests &amp; Treatments</a></li>
      <li><a href="#doctor-clinic">Clinic, Ratings &amp; Vitals</a></li>
      <li><a href="#doctor-reports">Reports &amp; Ads</a></li>
      <li><a href="#doctor-therapy">Therapy &amp; Progress</a></li>
    </ul>`;

html = html.replace(sidebarFind, sidebarReplace);

const mainEndFind = `        <div class="card-body">
          <p class="desc"><strong>Step 3:</strong> Tells the back-end to inspect the bucket, verify the file
            successfully landed, and return its validity state.</p>
        </div>
      </div>
    </section>`;

const mainEndReplace = mainEndFind + '\n' + injectHTML;

if (html.includes(mainEndFind)) {
  html = html.replace(mainEndFind, mainEndReplace);
  fs.writeFileSync('API_Documentation.html', html);
  console.log('Successfully injected API Documentation!');
} else {
  console.log('Could not find mainEndFind in API_Documentation.html');
}
