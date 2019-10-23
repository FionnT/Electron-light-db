# Electron-light-db

A lightweight Chrome.Storage - Mongoose like database for Electron which stores data in a single JSON blob file. 

Supports storing values at any depth level, and allows modifiying multiple values at a time at any depth level without overwriting existing values, or mutating types. 

  Usage
---
 
  Include a defaults.json file with pre-configured settings in JSON format.
  
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

  index.js 
    
    const electron = require('electron')
    const path = require('path')
    const app = electron.app
    const BrowserWindow = electron.BrowserWindow
    const db = require('electron-light-db')

    db.initialise({
      'storage': path.join(app.getPath('userData') + '/preferences.json'),
      'default': path.join(__dirname + '/static/defaults.json'),
      'reset': true // Boolean - use to force a full reset to defaults
    })
    
    db.set('screen', {"width" : 1200, "height": 1200});
    db.set('example.a.b.c.d.e', 5);
    db.set('example.a.b.c.d.e.f' {"h": 3, "i" : 5});
    
    db.get('screen', (screen) => {
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
    
    // Or we can just pass the full returned object as it's a JSON blob
   
    db.get('screen', (screen) => {
      mainWindow = new BrowserWindow(screen)
      mainWindow.loadFile('static/pages/index.pug')
    })  
    
    
    // Or we can get just the height value from storage 
    db.get('screen.height', (height) => {
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
    
     
