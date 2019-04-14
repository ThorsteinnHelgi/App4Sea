#!/usr/bin/env python
import datetime
from netCDF4 import Dataset as NetCDFFile
import numpy as np
import matplotlib.pyplot as plt
from simplekml import (Kml, OverlayXY, ScreenXY, Units, RotationXY, TimeStamp,
                       AltitudeMode, Camera, RefreshMode, ViewRefreshMode)

def make_kml(llcrnrlon, llcrnrlat, urcrnrlon, urcrnrlat,
             figs, tim, colorbar=None, **kw):
    """TODO: LatLon bbox, list of figs, optional colorbar figure,
    and several simplekml kw..."""

    kml = Kml()

    altitude = kw.pop('altitude', 2e7)
    roll = kw.pop('roll', 0)
    tilt = kw.pop('tilt', 0)
    altitudemode = kw.pop('altitudemode', AltitudeMode.relativetoground)

    camera = Camera(latitude=np.mean([urcrnrlat, llcrnrlat]),
                    longitude=np.mean([urcrnrlon, llcrnrlon]),
                    altitude=altitude, roll=roll, tilt=tilt,
                    altitudemode=altitudemode)

    author = kw.pop('author', 'ocefpaf')
    rotation = kw.pop('rotation', 0)
    description = kw.pop('description', 'Matplotlib figure')
    name = kw.pop('name', 'overlay')
    gxaltitudemode = kw.pop('gxaltitudemode', 'clampToSeaFloor')
    visibility = kw.pop('visibility', 1)

    kml.document.camera = camera
    kml.document.description = description
    kml.document.author = author

    draworder = 0
    for fig in figs:  # NOTE: Overlays are limited to the same bbox.
        begin = str(datetime.datetime.utcfromtimestamp(tim[draworder]))
        end = str(datetime.datetime.utcfromtimestamp(tim[draworder+1]))

        ground = kml.document.newgroundoverlay(name=name + " at " + begin)

        print (ground.name)

        #ground.draworder = draworder
        ground.visibility = visibility

        ground.gxaltitudemode = gxaltitudemode

        ground.timespan.begin = begin
        ground.timespan.end = end

        ground.icon.href = fig
        # this below is not working for some reason
        #ground.icon.RefreshMode =  RefreshMode.oninterval
        #ground.icon.refreshInterval = 300
        #ground.icon.viewRefreshMode = ViewRefreshMode.onstop
        #ground.icon.viewRefreshTime = 2
        #ground.icon.viewBoundScale = 0.85

        ground.latlonbox.rotation = rotation
        ground.latlonbox.east = llcrnrlon
        ground.latlonbox.south = llcrnrlat
        ground.latlonbox.north = urcrnrlat
        ground.latlonbox.west = urcrnrlon

        draworder += 1

    if colorbar:  # Options for colorbar are hard-coded (to avoid a big mess).
        screen = kml.newscreenoverlay(name='Legend')
        screen.icon.href = colorbar
        screen.overlayxy = OverlayXY(x=0, y=0,
                                     xunits=Units.fraction,
                                     yunits=Units.fraction)
        screen.screenxy = ScreenXY(x=0.015, y=0.075,
                                   xunits=Units.fraction,
                                   yunits=Units.fraction)
        screen.rotationXY = RotationXY(x=0.5, y=0.5,
                                       xunits=Units.fraction,
                                       yunits=Units.fraction)
        screen.size.x = 0
        screen.size.y = 0
        screen.size.xunits = Units.fraction
        screen.size.yunits = Units.fraction
        screen.visibility = 1

    kmzfile = kw.pop('kmzfile', 'overlay.kmz')
    kml.savekmz(kmzfile)
    return kml

def gearth_fig(llcrnrlon, llcrnrlat, urcrnrlon, urcrnrlat, pixels=1024):
    """Return a Matplotlib `fig` and `ax` handles for a Google-Earth Image."""
    aspect = np.cos(np.mean([llcrnrlat, urcrnrlat]) * np.pi/180.0)
    xsize = np.ptp([urcrnrlon, llcrnrlon]) * aspect
    ysize = np.ptp([urcrnrlat, llcrnrlat])
    aspect = ysize / xsize

    if aspect > 1.0:
        figsize = (10.0 / aspect, 10.0)
    else:
        figsize = (10.0, 10.0 * aspect)

    if False:
        plt.ioff()  # Make `True` to prevent the KML components from poping-up.
    fig = plt.figure(figsize=figsize,
                     frameon=False,
                     dpi=pixels//10)
    # KML friendly image.  If using basemap try: `fix_aspect=False`.
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(llcrnrlon, urcrnrlon)
    ax.set_ylim(llcrnrlat, urcrnrlat)
    return fig, ax

def odplot(z,lat,lon,ts,te,mass_oil,overlay):
    zs=z[ts:te]
    lons=lon[ts:te] 
    lons0=lons[zs==0]
    lats=lat[ts:te] 
    lats0=lats[zs==0]
    mass=mass_oil[ts:te]
    mass0=mass[zs==0]
    plt.scatter(lons0, lats0, c=mass0*100, s=2, marker='o', edgecolors=None) 
    plt.clim(0,100)
    ax.set_axis_off()
    fig.savefig(overlay, transparent=True, format='png')

    return overlay

#============================================================================================0
#ourpath = 'C:\\Users\\thors\\Documents\\GitHub\\App4Sea\\src\\main\\webapp\\data\\'
#ourfile = 'Vestmanna'
#ourext = '.nc'
ourpath = '../nc/'
ourfile = 'cuba_long_2011_point5'
ourext = '.nc'
ourdestext = '.kmz'
pixels = 1024

ds = NetCDFFile(ourpath + ourfile + ourext)
z=ds.variables['z'][:]
lat = ds.variables['lat'][:]
lon = ds.variables['lon'][:]
mass_oil = ds.variables['mass_oil'][:]
tim = ds.variables['time'][:]

fig, ax = gearth_fig(llcrnrlon=lon.min(),
                     llcrnrlat=lat.min(),
                     urcrnrlon=lon.max(),
                     urcrnrlat=lat.max(),
                     pixels=pixels)

#for dagtime in tim:
#    print (datetime.datetime.utcfromtimestamp(dagtime))

print ('Variables:')
#for vrbl in ds.variables:
#    print  (vrbl, end=', ')

print ()
i = 0
images = []
print ('Images(' + str(len(tim.data)-1) + ")")

while i < len(tim.data)-1:
    try:
        image = odplot(z, lat, lon, i, i+1, mass_oil, ourfile + str(i) + '.png')
        i = i+1
        images.append(image)
    except:
        break

kml = make_kml(llcrnrlon=lon.min(), llcrnrlat=lat.min(),
         urcrnrlon=lon.max(), urcrnrlat=lat.max(),
         figs=images, 
         tim = tim,
         colorbar='legend.png',
         kmzfile = ourfile + ourdestext, 
         name=ourfile,
         description='Oil spill drift prediction',
         author = 'Lars R. Hole',
         visibility = 0,
         gxaltitudemode=AltitudeMode.absolute, altitude=240000)

kml.save(ourfile + '.kml')

ds.close()
