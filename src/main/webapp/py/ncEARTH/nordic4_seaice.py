#!/usr/bin/env python
from datetime import datetime
from netCDF4 import Dataset as NetCDFFile
import numpy as np
import matplotlib.pyplot as plt
from simplekml import (Kml, OverlayXY, ScreenXY, Units, RotationXY, TimeStamp,
 

dt = datetime.now()
strg = '{:%B %d, %Y}'.format(dt)
print 'Today we have: '
print(strg)  
print dt
dt1 = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
print dt1
year = datetime.now().strftime("%Y")
print year
mon = datetime.now().strftime("%m")
print mon
day = datetime.now().strftime("%d")
print day


#


def seaiceplot(lat,lon,ts,te,SIconc,overlay):
	#lons=lon[:,ts] 
	#lats=lat[:,ts] 
	#SIconcs=SIconc[ts:te,:]
	SIconcs=SIconc[ts,:]
	#print len(lon)
	#print len(lat)
	print len(SIconcs)
	fig, ax = gearth_fig(
		     llcrnrlon=lon.min(),
		     llcrnrlat=kat.min(),
                     urcrnrlon=lon.max(),
                     urcrnrlat=lat.max(),
                     pixels=pixels)	
	#cs=plt.scatter(lons, lats, SIconcs, s=2, marker='o',edgecolors='none')
	#cs=plt.scatter(lons, lats, SIconcs, marker='o',edgecolors='none')
	cs=plt.contourf(lon, lat, SIconcs, levels=[0,0.1,0.2,0.4,0.6,0.8,1]) 
	plt.clim(0,1)
	#cbar = plt.colorbar(cs,location='right')
	plt.title('Wave forecast')
	ax.set_axis_off()
	fig.savefig(overlay, transparent=True, format='png')
	
	return overlay

#============================================================================================0
#ourpath = '/home/larsrh/Dropbox/ncEARTH/'
#ourfile = 'cuba_long_2011_point9'
ourfile = 'Nordic4'
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
#url='http://thredds.met.no/thredds/dodsC/topaz/dataset-topaz4-arc-unmasked-be'
#url='http://thredds.met.no/thredds/dodsC/sea/nordic4km/24h/aggregate_be'
url='http://thredds.met.no/thredds/dodsC/fou-hi/nordic4km/roms_nordic4.fc.24h.20190404.nc'

ds = NetCDFFile(url)
#z=ds.variables['z'][:]
lat = ds.variables['latitude'][:]
lon = ds.variables['longitude'][:]
#lon[lon>30]=np.nan
#lon[lon<-30]=np.nan
#print lon
SIconc = ds.variables['aice'][:] #Sea icea concentration
tim = ds.variables['time'][:]
#print tim
ds.close()
seaiceplot(lat,lon,i,i+1,SIconc,ourfile + str(i) + '.png')


print 'Time steps in file: '
for dagtime in tim:
    print (datetime.utcfromtimestamp(dagtime))

print ('Variables:')
for vrbl in ds.variables:
#    print  (vrbl, end=', ')
	print vrbl
print ()
print 'Number of time steps: '
print len(tim.data)
i = 0
images = []
print ('Images(' + str(len(tim.data)-1) + ")")
#print ('Images(' + str(len((tim.data)-1)/24) + ")")

while i < len(tim.data)-1:
    try:
        #image = odplot(z, lat, lon, i, i+1, mass_oil, ourfile + str(i) + '.png')
	image=
        #i = i+1
	i=i+1
        images.append(image)
    except:
        break
SIconcs=SIconc[0,:]
cs=plt.contourf(lon, lat, SIconcs, levels=[0,0.1,0.2,0.4,0.6,0.8,1]) 

fig = plt.figure(figsize=(2.0, 7.0), facecolor=None, frameon=True)
ax = fig.add_axes([0.0, 0.05, 0.2, 0.9])
cb = fig.colorbar(cs, cax=ax)
cb.set_label('Sea Ice Area Fraction from Nordic4km ROMS', rotation=-90, color='k', labelpad=20)
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
