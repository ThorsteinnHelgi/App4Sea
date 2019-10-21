#!/usr/bin/env python
from datetime import datetime,timedelta
from netCDF4 import Dataset as NetCDFFile
import numpy as np
import matplotlib.pyplot as plt
from simplekml import (Kml, OverlayXY, ScreenXY, Units, RotationXY, TimeStamp,
                       AltitudeMode, Camera, RefreshMode, ViewRefreshMode)
#
import os
import fnmatch
 
# Get a list of all files in directory
for rootDir, subdirs, filenames in os.walk('/home/larsrh/Dropbox/cuba_runs/ncEARTH/'):
    # Find the files that matches the given patterm
    for filename in fnmatch.filter(filenames, '*.png'):
        try:
            os.remove(os.path.join(rootDir, filename))
        except OSError:
            print("Error while deleting file")

yesterday = datetime.now()-timedelta(1)
strg = '{:%B %d, %Y}'.format(yesterday)
print 'Yesterday we had: '
print(strg)  
print yesterday
dt1 = yesterday.strftime("%Y-%m-%d %H:%M:%S")
print dt1
year = yesterday.strftime("%Y")
print year
mon = yesterday.strftime("%m")
print mon
day = yesterday.strftime("%d")
print day


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

#ds = NetCDFFile('../nc/cuba_long_2012_point3.nc')

def waveplot(lat,lon,ts,te,Hs,overlay):
	#lons=lon[:,ts] 
	#lats=lat[:,ts] 
	#Hss=Hs[ts:te,:]
	Hss=Hs[ts,:]
	#print len(lon)
	#print len(lat)
	print len(Hss)
	fig, ax = gearth_fig(llcrnrlon=lon.min(),
                     llcrnrlat=lat.min(),
                     urcrnrlon=lon.max(),
                     urcrnrlat=lat.max(),
                     pixels=pixels)	
	#cs=plt.scatter(lons, lats, Hss, s=2, marker='o',edgecolors='none')
	#cs=plt.scatter(lons, lats, Hss, marker='o',edgecolors='none')
	cs=plt.contourf(lon, lat, Hss, levels=[0,1,2,3,4,6,8,10,12]) 
	plt.clim(0,12)
	#cbar = plt.colorbar(cs,location='right')
	plt.title('Wave forecast')
	ax.set_axis_off()
	fig.savefig(overlay, transparent=True, format='png')
	
	return overlay

#============================================================================================0
ourpath = '/home/larsrh/Dropbox/nc/'
#ourfile = 'cuba_long_2011_point9'
ourfile = 'wave_forecast'
ourext = '.nc'
ourdestext = '.kmz'
pixels = 4*1024

#ds = NetCDFFile(ourpath + ourfile + ourext)
#z=ds.variables['z'][:]
#lat = ds.variables['lat'][:]
#lon = ds.variables['lon'][:]
#mass_oil = ds.variables['mass_oil'][:]
#tim = ds.variables['time'][:]
#url='http://thredds.met.no/thredds/dodsC/fou-hi/mywavewam4archive/2019/03/25/MyWave_wam4_WAVE_20190325T06Z.nc'
#url='http://thredds.met.no/thredds/dodsC/fou-hi/mywavewam4archive/'+year+'/'+mon+'/'+day+'/MyWave_wam4_WAVE_'+year+mon+day+'T00Z.nc'
url='http://thredds.met.no/thredds/dodsC/sea/dataset-mywavewam8-'+year+mon+day
ds = NetCDFFile(url)
#z=ds.variables['z'][:]
lat = ds.variables['latitude'][:]
lon = ds.variables['longitude'][:]
Hs = ds.variables['VHM0'][:] #Significant wave height
tim = ds.variables['time'][:]
#print tim
ds.close()
fig, ax = gearth_fig(llcrnrlon=lon.min(),
                     llcrnrlat=lat.min(),
                     urcrnrlon=lon.max(),
                     urcrnrlat=lat.max(),
                     pixels=pixels)

print 'Time steps in file: '
for dagtime in tim:
    print (datetime.utcfromtimestamp(dagtime))

print ('Variables:')
for vrbl in ds.variables:
#    print  (vrbl, end=', ')
	print vrbl
print ()

i = 0
images = []
#print ('Images(' + str(len(tim.data)-1) + ")")
print ('Images(' + str(len((tim.data)-1)/24) + ")")

while i < len(tim.data)-1:
    try:
        #image = odplot(z, lat, lon, i, i+1, mass_oil, ourfile + str(i) + '.png')
	image=waveplot(lat,lon,i,i+1,Hs,ourfile + str(i) + '.png')
        #i = i+1
	i=i+24
        images.append(image)
    except:
        break
Hss=Hs[0,:]
cs=plt.contourf(lon, lat, Hss, levels=[0,1,2,3,4,6,8,10,12]) 

fig = plt.figure(figsize=(2.0, 7.0), facecolor=None, frameon=True)
ax = fig.add_axes([0.0, 0.05, 0.2, 0.9])
cb = fig.colorbar(cs, cax=ax)
cb.set_label('Significant wave height forecast (WAM4km model at 00Z) from MET Norway [m]', rotation=-90, color='k', labelpad=20)
fig.savefig('legend.png', transparent=True, format='png')  # Change transparent to True if your colorbar is not on space :)


kml = make_kml(llcrnrlon=lon.min(), llcrnrlat=lat.min(),
         urcrnrlon=lon.max(), urcrnrlat=lat.max(),
         figs=images, 
         tim = tim[0::24],
         colorbar='legend.png',
         kmzfile = ourfile + ourdestext, 
         name=ourfile,
         description='MET wave forecast',
         author = 'Lars R. Hole',
         visibility = 0,
         gxaltitudemode=AltitudeMode.absolute, altitude=240000)

kml.save(ourfile + '.kml')

#ds.close()