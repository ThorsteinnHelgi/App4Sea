#!/usr/bin/env python
from datetime import datetime,timedelta
from netCDF4 import Dataset as NetCDFFile
from mpl_toolkits.basemap import Basemap, cm
import numpy as np
import matplotlib.pyplot as plt
from simplekml import (Kml, OverlayXY, ScreenXY, Units, RotationXY, TimeStamp,
                       AltitudeMode, Camera, RefreshMode, ViewRefreshMode)
#
import os
import fnmatch
from palettable import colorbrewer
 
# Get a list of all files in directory
for rootDir, subdirs, filenames in os.walk('/home/larsrh/Dropbox/ncEARTH/'):
    # Find the files that matches the given patterm
    for filename in fnmatch.filter(filenames, '*.png'):
        try:
            os.remove(os.path.join(rootDir, filename))
        except OSError:
            print("Error while deleting file")

yesterday = datetime.now()-timedelta(2)
strg = '{:%B %d, %Y}'.format(yesterday)
print ('Yesterday we had: ')
print(strg)  
print (yesterday)
dt1 = yesterday.strftime("%Y-%m-%d %H:%M:%S")
print (dt1)
year = yesterday.strftime("%Y")
print (year)
mon = yesterday.strftime("%m")
print (mon)
day = yesterday.strftime("%d")
print (day)


#
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
        begin = str(datetime.utcfromtimestamp(tim[draworder]))
        end = str(datetime.utcfromtimestamp(tim[draworder+1]))

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
    #if True:
        plt.ioff()  # Make `True` to prevent the KML components from poping-up.
    fig = plt.figure(figsize=figsize,
                     frameon=False,
                     dpi=pixels//10)
    # KML friendly image.  If using basemap try: `fix_aspect=False`.
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(llcrnrlon, urcrnrlon)
    ax.set_ylim(llcrnrlat, urcrnrlat)
    return fig, ax
m = Basemap(projection='ortho', resolution=None, lat_0=50, lon_0=0)
#ds = NetCDFFile('../nc/cuba_long_2012_point3.nc')

def waveplot(lat,lon,ts,te,Var,overlay):
	
	#m.bluemarble(scale=0.5);
	#Vars=Var[ts:te,:]
	Vars=Var[ts,:,:]
	#print len(lon)
	#print len(lat)
	cmap = colorbrewer.get_map('RdYlGn', 'diverging', 11, reverse=True).mpl_colormap
	fig, ax = gearth_fig(llcrnrlon=lons.min(),
                     llcrnrlat=lats.min(),
                     urcrnrlon=lons.max(),
                     urcrnrlat=lats.max(),
                     pixels=pixels)	

	(x,y)=m(lon,lat)	
	cs = m.pcolormesh(x, y, Vars, cmap=cmap)
	#cbar = plt.colorbar(cs,location='right')
	#plt.title('Var forecast')
	#ax.set_axis_off()
	fig.savefig(overlay, transparent=False, format='png')
	
	return overlay

#============================================================================================0
ourpath = '/home/larsrh/Dropbox/nc/'
ourfile = 'Var'
ourext = '.nc'
ourdestext = '.kmz'
pixels = 2*1024

url='http://thredds.met.no/thredds/dodsC/sea/dataset-mywavewam8-'+year+mon+day
ds = NetCDFFile(url)
#z=ds.variables['z'][:]
lats = ds.variables['latitude'][:,:]
lons = ds.variables['longitude'][:,:]

#Var1 = ds.variables['Var'][:] #Ocean Var
#Var = ds.variables['Current'][:,:,:] #Current speed

Var = ds.variables['VHM0'][:,:,:] #Significant wave height
print (lons.shape)
print (lats.shape)
print (Var.shape)

tim = ds.variables['time'][:]
#print tim
ds.close()



print ('Time steps in file: ')
for dagtime in tim:
    print (datetime.utcfromtimestamp(dagtime))

print ('Variables:')
for vrbl in ds.variables:
#    print  (vrbl, end=', ')
	print (vrbl)
print ()

i = 0
images = []
#print ('Images(' + str(len(tim.data)-1) + ")")
print ('Images(' + str(len((tim.data)-1)/24) + ")")

while i < len(tim.data)-1:
	try:
		#image = odplot(z, lat, lon, i, i+1, mass_oil, ourfile + str(i) + '.png')
		image=waveplot(lats,lons,i,i+1,Var,ourfile + str(i) + '.png')
		#i = i+1
		i=i+24
		images.append(image)
	except:    
		break
Vars=Var[0,:,:]
#cs=plt.contourf(lons, lats, Vars, levels=[-1,-0.5,0,0.1,0.2,0.3,0.4,0.6,0.8,1]) 
(x,y)=m(lons,lats)
cmap = colorbrewer.get_map('RdYlGn', 'diverging', 11, reverse=True).mpl_colormap
cs = m.pcolormesh(x, y, Vars, cmap=cmap)

fig = plt.figure(figsize=(2.0, 7.0), facecolor=None, frameon=True)
ax = fig.add_axes([0.0, 0.05, 0.2, 0.9])
cb = fig.colorbar(cs, cax=ax)
cb.set_label('Significant wave height (WAM8km model at 00Z) from MET Norway', rotation=-90, color='k', labelpad=20)
fig.savefig('legend.png', transparent=True, format='png')  # Change transparent to True if your colorbar is not on space :)



kml = make_kml(llcrnrlon=lons.min(), llcrnrlat=lats.min(),
         urcrnrlon=lons.max(), urcrnrlat=lats.max(),
         figs=images, 
         tim = tim[0::24],
         colorbar='legend.png',
         kmzfile = ourfile + ourdestext, 
         name=ourfile,
         description='MET wave forecast',
         author = 'Lars R. Hole (lrh@met.no)',
         visibility = 100,
         gxaltitudemode=AltitudeMode.absolute, altitude=240000)

kml.save(ourfile + '.kml')

#ds.close()
