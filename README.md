# Electron-light-db

A lightweight Chrome.Storage - Mongoose like database for Electron which stores data in a single JSON blob file. 

Supports storing values at any depth level, and allows modifiying multiple values at a time at any depth level without overwriting existing values, or mutating types. 

## Usage
 
  Include a defaults.json file with pre-configured settings in JSON format:
  (It can be an empty file)
  
    {
      "screen": {
        "width": 100,
        "height": 1200,
        "skipTaskbar": true,
        "frame": true
      }
      "example" : {
        a: {
          b: {
            c: {
              d: {
                e: 3,
                f: {
                  h: 1,
                  i: 2
                }
              }
            }
          }
        }
    }
    

### Initialising the module:

The initialise call with default, and storage value specified is required at least once per application run, but values are stored thereafter

    const electron = require('electron')
    const path = require('path')
    const app = electron.app
    const db = require('electron-light-db')
   
    db.initialise({
      'storage': path.join(app.getPath('userData') + '/preferences.json'),
      'default': path.join(__dirname + '/static/defaults.json'),
      'reset': true // Boolean - use to force a full reset to defaults
    })
    

### Get Operations:  

##### Format: 

    @param key: String - The key to set, or subkey specified with key.subkey.subkey notation
    @param data: Any - Returned key:value pair, or false if there was an error
    @param err: Any - Only returned is data is false, there was an error
    @param force (optional): Boolean - Forces a re-read of the preferences.json file to make sure we have the up to date 
                  version - Defaults to true.
    
    // Call back is optional
    db.get(key, (data, err) => {
      // Do stuff
    }, force)  
    
    
 
###### We can pull the blob and specify sub-keys:
    
    let example = db.get('example')
    
    db.get(key, (screen) => {
      mainWindow = new BrowserWindow({
        "width": screen.width,
        "height": screen.height,
        "skipTaskbar": screen.skipTaskbar,
        "frame": screen.frame,
        webPreferences: {
          devTools: true,
          scrollBounce: true,
          preload: path.join(__dirname, 'preload.js')
        }
      })
      mainWindow.loadFile('static/pages/index.pug')
    })  
    
###### We can pass the full return as it's a JSON blob:
   
    db.get('screen', (screen) => {
      mainWindow = new BrowserWindow(screen)
      mainWindow.loadFile('static/pages/index.pug')
    })  
    
    
###### Or we can pull indivual values from storage (any depth): 
  
    db.get('example.a.b.c.d.e.f', (height) => {
      mainWindow = new BrowserWindow({
        "width": 1200,
        "height": height,
        webPreferences: {
          devTools: true,
          scrollBounce: true,
          preload: path.join(__dirname, 'preload.js')
        }
      })
      mainWindow.loadFile('static/pages/index.pug')
    }) 
    
###### Lastly we can also reference returned values without using a callback via async/await: 
    
    const example = async () => {
      const screen = await db.get('screen')
      console.log(screen)
    }
    example()

### Set operations: 
  
###### Format: 

    @param key: String - The key to set, or subkey specified with key.subkey.subkey notation
    @param value: Any - The value to update the key to
    @param success (optional): Any - Returns updated key:value pair, or false if there was an error
    @param err (optional): Any - Only returned if success is false
    @param force (optional): Boolean - Forces a re-read of the preferences.json file to make sure we have the up to date
                  version - defaults to true.
  
    // Callback is optional
    db.set(key, value, (success, err) => { 
      // do stuff
    }, force);
    
  
###### We can pass a JSON blob into a key name, and it's objects will be merged, overwriting passed keys, but retaining any other existing keys: 

    db.set('screen', {"width" : 1200, "height": 1200});
      
    // This format works at any depth level: 
    
    db.set('example.a.b.c.d.e.f' {"h": 3, "i" : 5});

###### We can also simply modify any key individually :

    db.set('example', "test");
   
    // This format also works at any depth level:
    
    db.set('example.a.b.c.d.e', 5);
        

###### Resetting a value to the default setting pulled from defaults.json: 
  
    db.reset('screen') // Must be a string
    db.reset('screen.height')
    db.reset('example.a.b.c.d.e')
