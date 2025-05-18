// check-site.js
import https from 'https';
import http from 'http';
import { URL } from 'url';

const targetUrl = 'https://www.smartphonereparatur-muenchen.de/';
const userAgent = 'ghost/1.0 (+https://muchandy.de)';

async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
      },
    };

    const req = protocol
      .request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      })
      .on('error', (err) => {
        reject(err);
      });

    req.end();
  });
}

async function checkSite() {
  console.log(`Analyzing website: ${targetUrl}`);
  console.log(`Using User-Agent: ${userAgent}`);
  console.log('---------------------------------------------');

  try {
    // First try to fetch robots.txt
    console.log('\n1. Checking robots.txt');
    const robotsTxtUrl = new URL('/robots.txt', targetUrl).toString();
    const robotsResponse = await fetchUrl(robotsTxtUrl);

    let hasRobotsFile = false;
    let disallowAll = false;

    if (robotsResponse.statusCode === 200) {
      console.log('✅ robots.txt found!');
      console.log('\n--- robots.txt Content ---\n');
      console.log(robotsResponse.body);

      hasRobotsFile = true;

      // Check for indications it's disallowing bots
      disallowAll = robotsResponse.body.includes('Disallow: /');
      if (disallowAll) {
        console.log(
          '\n⚠️ Warning: robots.txt appears to disallow all crawling'
        );
      } else {
        console.log("\n✅ robots.txt doesn't appear to disallow all crawling");
      }

      // Check if we have PHP errors instead of a real robots.txt
      const isPhpError =
        robotsResponse.body.includes('Fatal error') ||
        robotsResponse.body.includes('Warning:') ||
        robotsResponse.body.includes('Notice:');

      if (isPhpError) {
        console.log(
          '\n⚠️ Warning: robots.txt contains PHP errors, not actual robots directives'
        );
        console.log('   The site might be experiencing technical issues');
        hasRobotsFile = false;
      }
    } else {
      console.log(
        `❌ Failed to fetch robots.txt: HTTP ${robotsResponse.statusCode}`
      );
      console.log(
        "This may indicate that the site doesn't have a robots.txt file,"
      );
      console.log(
        'the file is inaccessible, or the server is experiencing issues.'
      );
    }

    // Check main page for meta robots tag
    console.log('\n2. Checking for meta robots tags on main page');
    const mainPageResponse = await fetchUrl(targetUrl);

    if (mainPageResponse.statusCode === 200) {
      console.log('✅ Main page loaded successfully');

      // Look for meta robots tag
      const hasMetaRobotsNoindex =
        mainPageResponse.body.includes(
          '<meta name="robots" content="noindex'
        ) ||
        mainPageResponse.body.includes('<meta content="noindex" name="robots"');

      if (hasMetaRobotsNoindex) {
        console.log('⚠️ Warning: Found meta robots noindex tag on main page');
      } else {
        console.log('✅ No meta robots noindex tag found on main page');
      }
    } else {
      console.log(
        `❌ Failed to fetch main page: HTTP ${mainPageResponse.statusCode}`
      );
    }

    // Check Terms of Service or similar pages for crawling policy
    console.log('\n3. Checking Terms of Service for crawling restrictions');
    const tosUrls = [
      '/terms',
      '/terms-of-service',
      '/tos',
      '/datenschutz',
      '/impressum',
      '/agb',
    ];

    let foundPolicyPage = false;
    let hasCrawlingRestrictions = false;

    for (const tosPath of tosUrls) {
      const tosUrl = new URL(tosPath, targetUrl).toString();
      try {
        const tosResponse = await fetchUrl(tosUrl);
        if (tosResponse.statusCode === 200) {
          console.log(`✅ Found policy page at ${tosUrl}`);
          foundPolicyPage = true;

          // Look for terms related to crawling or scraping
          const contentLower = tosResponse.body.toLowerCase();
          hasCrawlingRestrictions =
            contentLower.includes('scraping') ||
            contentLower.includes('crawling') ||
            contentLower.includes('automated access') ||
            contentLower.includes('bot') ||
            contentLower.includes('automatisierte');

          if (hasCrawlingRestrictions) {
            console.log(
              '⚠️ Warning: Page contains terms related to scraping or crawling'
            );
            console.log(
              '   Manual review recommended to ensure compliance with site policies'
            );
          }

          break;
        }
      } catch (error) {
        // Just continue to the next URL
      }
    }

    if (!foundPolicyPage) {
      console.log('ℹ️ No policy page found from common URLs');
    }

    // Check if the site has an appropriate rate limit
    console.log('\n4. Rate Limiting Recommendations');
    console.log('Based on best practices:');
    console.log('✅ Add at least 1 second delay between requests');
    console.log('✅ Avoid making concurrent requests');
    console.log('✅ Consider implementing exponential backoff for errors');

    console.log('\n---------------------------------------------');
    console.log('Summary:');
    if (!hasRobotsFile) {
      console.log('⚠️ Valid robots.txt not found - proceed with caution');
      console.log('   Consider implementing a conservative crawling policy:');
      console.log('   - Longer delays between requests (2-3 seconds)');
      console.log(
        '   - Only crawl public pages directly related to your target data'
      );
      console.log('   - Add contact information in your user-agent');
    } else if (disallowAll) {
      console.log('⚠️ robots.txt appears to disallow crawling');
      console.log('   Consider contacting the site owner for permission');
    } else {
      console.log(
        '✅ The site appears to be crawlable with proper rate limiting'
      );
      console.log(
        '   Always respect server responses and implement appropriate delays'
      );
    }

    console.log('\nCrawling recommendation:');
    if (hasRobotsFile && !disallowAll && !hasCrawlingRestrictions) {
      console.log('✅ GREEN - Good to crawl with proper rate limiting');
    } else if (hasCrawlingRestrictions) {
      console.log(
        '⚠️ RED - Policy pages mention restrictions on crawling, manual review needed'
      );
    } else {
      console.log(
        '🟡 YELLOW - Use caution, implement conservative crawling practices'
      );
    }
  } catch (error) {
    console.error('Error analyzing website:', error.message);
  }
}

checkSite();
