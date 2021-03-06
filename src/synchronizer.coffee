Spine     = require('spine')
SocketIO  = require('./vendor/socket.io')
window.SocketIO = SocketIO

MessageClient   = require('./message_client')
AppContext      = require('./app_context')
MetaContext     = require('./meta_context')
ResourceClient  = require('./resource_client')

# Atmosphere.Synchronizer
#
# The main interface used mostly for configuration and management of the
# synchronization.
# -----------------------------------------------------------------------------

class Synchronizer extends Spine.Module
  @include Spine.Events

  # Object lifecycle
  # ---------------------------------------------------------------------------
  
  constructor: (options) ->
    @messageClient = new MessageClient(this)
    @metaContext = new MetaContext()
    @appContext = new AppContext()
    @resourceClient = new ResourceClient(sync: this, appContext: @appContext)
    @_needsSync = false
    @_isSyncInProgress = false
    Synchronizer.instance = this
    Synchronizer.res = @resourceClient

  # App objects
  updateOrCreate: (uri, item) ->
    # Check for ID change
    if item.id && item.id != uri.id
      console.log "changing id #{uri.id} -> #{item.id}"
      @appContext.changeID(uri, item.id)
      @metaContext.changeIDAtURI(uri, item.id)
      uri.id = item.id
    @appContext.updateOrCreate(uri, item)

  # Resource interface
  # ---------------------------------------------------------------------------

  fetch: (params...) ->
    @resourceClient.fetch(params...)
  
  save: (object, options) ->
    if options.sync
      object.save()
      uri = @appContext.objectURI(object)
      options = object.remoteSaveOptions(options) if object.remoteSaveOptions?
      @resourceClient.save(object, options)
    else
      object.save()
      @markObjectChanged(object)
      @setNeedsSync()
  
  execute: (params...) -> @resourceClient.execute(params...)
  request: (params...) -> @resourceClient.request(params...)
    

  # Meta objects
  # ---------------------------------------------------------------------------
  
  markObjectChanged: (object) ->
    uri = @appContext.objectURI(object)
    @metaContext.markURIChanged(uri)
  
  markURISynced: (uri) ->
    @metaContext.markURISynced(uri)
  
  # Synchronization
  # ---------------------------------------------------------------------------

  setNeedsSync: ->
    @_needsSync = true
    @startSync()
  
  startSync: ->
    return unless @_needsSync == true
    # return if @_isSyncInProgress == true
    @_isSyncInProgress = true
    resourceClient = @resourceClient
    @metaContext.changedObjects (metaObjects) =>
      for metaObject in metaObjects
        action = if metaObject.isLocalOnly then "create" else "update"
        console.log "syncing meta object #{action}", metaObject
        object = @appContext.objectAtURI(metaObject.uri)
        options = {action: action}
        options = object.remoteSaveOptions(options) if object.remoteSaveOptions?
        resourceClient.save(object, options)
        # TODO: Finish sync
  
  removeObjectsNotInList: (collection, ids, scope) ->
    uris = @appContext.allURIs(collection, scope)
    for uri in uris
      isInList = ids.indexOf(uri.id) != -1
      if !isInList
        @metaContext.isURILocalOnly uri, (res) =>
          return if res == true # Don't destroy if object is local only
          console.log "[ResourceClient] Local id #{uri.id} wasn't retrieved, destroying."
          @appContext.destroy(uri)
    
  # Auth
  # ---------------------------------------------------------------------------  
  
  setAuthKey: (key) ->
    @authKey = key

  hasAuthKey: ->
    @authKey? && @authKey != ""

  didAuth: (content) ->
    @trigger("auth_success")
    @getChanges()

  didFailAuth: (content) ->
    @trigger("auth_fail")


module.exports = Synchronizer