# Configurazione Server per itinerarioregalbuto.magnetico.cloud

## Apache (.htaccess)

```apache
RewriteEngine On

# App Link verification per Android
RewriteRule ^\.well-known/assetlinks\.json$ /assetlinks.json [L]

# Universal Link verification per iOS  
RewriteRule ^\.well-known/apple-app-site-association$ /apple-app-site-association [L]

# Redirect monumenti specifici con user-agent detection
RewriteCond %{HTTP_USER_AGENT} "magnetico-heritage-android" [NC]
RewriteRule ^([a-zA-Z0-9\-]+)/?$ magneticoheritagescheme://monument/$1 [R=302,L]

RewriteCond %{HTTP_USER_AGENT} "magnetico-heritage-ios" [NC]  
RewriteRule ^([a-zA-Z0-9\-]+)/?$ magneticoheritage://monument/$1 [R=302,L]

# Fallback web per tutti gli altri user-agent
RewriteRule ^([a-zA-Z0-9\-]+)/?$ https://magnetico-associazione-culturale.github.io/Regalbuto-Heritage/?deep=$1 [R=302,L]

# Root redirect
RewriteRule ^/?$ https://magnetico-associazione-culturale.github.io/Regalbuto-Heritage/ [R=302,L]
```

## Nginx

```nginx
server {
    listen 80;
    server_name itinerarioregalbuto.magnetico.cloud;
    
    # App Links/Universal Links verification
    location /.well-known/assetlinks.json {
        try_files /assetlinks.json =404;
    }
    
    location /.well-known/apple-app-site-association {
        try_files /apple-app-site-association =404;
    }
    
    # Monument redirects
    location ~ ^/([a-zA-Z0-9\-]+)/?$ {
        set $monument_id $1;
        
        # Check user agent for native apps
        if ($http_user_agent ~* "magnetico-heritage-android") {
            return 302 magneticoheritagescheme://monument/$monument_id;
        }
        
        if ($http_user_agent ~* "magnetico-heritage-ios") {
            return 302 magneticoheritage://monument/$monument_id;
        }
        
        # Default web fallback
        return 302 https://magnetico-associazione-culturale.github.io/Regalbuto-Heritage/?deep=$monument_id;
    }
    
    # Root redirect
    location = / {
        return 302 https://magnetico-associazione-culturale.github.io/Regalbuto-Heritage/;
    }
}
```

## App Links/Universal Links Configuration Files

### Android App Links (assetlinks.json)
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "org.magnetico.heritage",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_CERTIFICATE_FINGERPRINT_HERE"
      ]
    }
  }
]
```

### iOS Universal Links (apple-app-site-association)
```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["TEAM_ID.org.magnetico.heritage"],
        "components": [
          {
            "/": "/*",
            "comment": "All monument deep links"
          }
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": ["TEAM_ID.org.magnetico.heritage"]
  }
}
```

## URL Examples for QR Codes

```
https://itinerarioregalbuto.magnetico.cloud/chiesa-santa-maria-la-croce
https://itinerarioregalbuto.magnetico.cloud/chiesa-madre-san-basilio  
https://itinerarioregalbuto.magnetico.cloud/palazzo-comunale
https://itinerarioregalbuto.magnetico.cloud/monumento-ai-caduti
https://itinerarioregalbuto.magnetico.cloud/cineteatro-urania
```

## Testing

Console commands for testing the deep link system:

```javascript
// Show all QR URLs
deepLinkUtils.showAllQRUrls()

// Generate CSV for QR code printing
deepLinkUtils.generateQRCodeCSV()

// Test a specific deep link
deepLinkUtils.testDeepLink('chiesa-santa-maria-la-croce')
```
