#!/usr/bin/env python
from netCDF4 import Dataset as NetCDFFile
import numpy as np
import matplotlib.pyplot as plt
import numpy.ma as ma
from simplekml import (Kml, OverlayXY, ScreenXY, Units, RotationXY,
                       AltitudeMode, Camera)

def make_kml(llcrnrlon, llcrnrlat, urcrnrlon, urcrnrlat,
             figs, colorbar=None, **kw):
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

    kml.document.camera = camera
    draworder = 0
    for fig in figs:  # NOTE: Overlays are limited to the same bbox.
        draworder += 1
        ground = kml.newgroundoverlay(name='GroundOverlay')
        ground.draworder = draworder
        #ground.visibility = kw.pop('visibility', 1)
	ground.visibility = kw.pop('visibility', 1)
        ground.name = kw.pop('name', 'overlay')
        ground.color = kw.pop('color', '9effffff')
	#ground.color = kw.pop('color', 'ff0000ff')
        ground.atomauthor = kw.pop('author', 'ocefpaf')
        ground.latlonbox.rotation = kw.pop('rotation', 0)
        ground.description = kw.pop('description', 'Matplotlib figure')
        ground.gxaltitudemode = kw.pop('gxaltitudemode',
                                       'clampToSeaFloor')
        ground.icon.href = fig
        ground.latlonbox.east = llcrnrlon
        ground.latlonbox.south = llcrnrlat
        ground.latlonbox.north = urcrnrlat
        ground.latlonbox.west = urcrnrlon

    if colorbar:  # Options for colorbar are hard-coded (to avoid a big mess).
        screen = kml.newscreenoverlay(name='ScreenOverlay')
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
    #fix_aspect=False
    return fig, ax
# initialise the kml object
#kml = Kml()
#ds = NetCDFFile('../nc/cuba_long_2012_point3.nc')
url='http://thredds.met.no/thredds/dodsC/fou-hi/mywavewam4/mywavewam4.fc.2019031818.nc'
ds = NetCDFFile(url)
#z=ds.variables['z'][:]
lat = ds.variables['latitude'][:]
lon = ds.variables['longitude'][:]
Hs = ds.variables['hs'][:] #Significant wave height
ds.close()
def waveplot(lat,lon,ts,Hs,overlay):
	#lons=lon[:,ts] 
	#lats=lat[:,ts] 
	Hss=Hs[ts,:]
	print len(lon)
	print len(lat)
	print len(Hss)
	#cs=plt.scatter(lons, lats, Hss, s=2, marker='o',edgecolors='none')
	#cs=plt.scatter(lons, lats, Hss, marker='o',edgecolors='none')
	cs=plt.contourf(lon, lat, Hss, levels=[0,1,2,3,4,5,6]) 
	#plt.clim(0,10)
	#cbar = plt.colorbar(cs,location='right')
	ax.set_axis_off()
	fig.savefig(overlay, transparent=False, format='png')

#y, x = np.meshgrid(lat[1:100], lon[1:100])

#mass = ma.masked_equal(mass, 9999.0)
#D50 = ds.variables['meanD50'][:]
#std = ds.variables['sigmaD50'][:]
# create kml polygon object with name
#single_point = kml.newpoint(name="Oil spill", coords=[(0.0,0.0)])
#from palettable import colorbrewer

pixels = 1024 * 2
#cmap = colorbrewer.get_map('RdYlGn', 'diverging', 11, reverse=True).mpl_colormap

fig, ax = gearth_fig(llcrnrlon=lon.min(),
                     llcrnrlat=lat.min(),
                     urcrnrlon=lon.max(),
                     urcrnrlat=lat.max(),
                     pixels=pixels)
waveplot(lat,lon,3,Hs,'overlay1.png')
waveplot(lat,lon,4,Hs,'overlay2.png')
#cs = ax.pcolormesh(x, y, mass, cmap=cmap)



make_kml(llcrnrlon=lon.min(), llcrnrlat=lat.min(),
         urcrnrlon=lon.max(), urcrnrlat=lat.max(),
         figs=['overlay1.png', 'overlay2.png'], colorbar='legend.png',
         kmzfile='MyWave4km.kmz', name='MyWave4km1')


#kml.save("Oil.kml")

