#!/usr/bin/env python
import sys
import time
import zipfile
import numpy as np
from netCDF4 import Dataset as NetCDFFile
import matplotlib.pyplot as plt
from simplekml import (Kml, OverlayXY, ScreenXY, Units, RotationXY, AltitudeMode, Camera)

def make_kml(llcrnrlon, llcrnrlat, urcrnrlon, urcrnrlat,
             figs, tim, colorbar=None, **kw):
    """TODO: LatLon bbox, list of figs, optional colorbar figure,
    and several simplekml kw..."""

    # Get data from parameter or use defaults
    altitude = kw.pop('altitude', 2e7)
    roll = kw.pop('roll', 0)
    tilt = kw.pop('tilt', 0)
    altitudemode = kw.pop('altitudemode', AltitudeMode.relativetoground)
    author = kw.pop('author', 'ocefpaf')
    rotation = kw.pop('rotation', 0)
    description = kw.pop('description', 'Matplotlib figure')
    name = kw.pop('name', 'overlay')
    gxaltitudemode = kw.pop('gxaltitudemode', 'clampToSeaFloor')
    visibility = kw.pop('visibility', 1)
    kmzfile = kw.pop('kmzfile', 'overlay.kmz')

    # Create kml
    kml = Kml()
    kml.document.name = name
    kml.document.description = description
    kml.document.atomauthor = author

    # Create camera
    camera = Camera(latitude=np.mean([urcrnrlat, llcrnrlat]),
                    longitude=np.mean([urcrnrlon, llcrnrlon]),
                    altitude=altitude, roll=roll, tilt=tilt,
                    altitudemode=altitudemode)
    kml.document.camera = camera

    # Create folder in the kml to hold the overlays
    folder = kml.newfolder(name = name)
    folder.name = name

    # Create overlays
    draworder = 0
    for fig in figs:  # NOTE: Overlays are limited to the same bbox.
        begin = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(tim[draworder]))
        end = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(tim[draworder+1]))

        # Place all in the folder
        ground = folder.newgroundoverlay(name=name + " at " + begin)

        print (ground.name)

        ground.draworder = draworder
        ground.visibility = visibility
        ground.gxaltitudemode = gxaltitudemode

        ground.timespan.begin = begin
        ground.timespan.end = end

        ground.icon.href = 'files\\' + fig
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

    # Create Colorbar
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

    kml.save(ourfile + '.kml')
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

def odplot(z, lat, lon, mass_oil, tim, ts, overlay):
    zs=z[:,ts]
    zs=zs[0:mx]
    zst=np.transpose(zs)

    lons=lon[:,ts]
    lons=lons[0:mx]
    lons0=lons[zst==0]

    lats=lat[:,ts]
    lats=lats[0:mx]
    lats0=lats[zst==0]

    mass=mass_oil[:,ts]
    mass=mass[0:mx]
    mass0=mass[zst==0]

    # Do some logging
    global tot
    with open("py.log", "a") as f:
        print ("----- ", ts, ": Time: ", time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(tim[ts])), f" ({len(lons)})", file=f)
        i=0

        tot = tot + len(lons0)
        #while i < len(lons0):
        #    print(f"{lons0[i]}, {lats0[i]}: {mass[i]}", file=f)
        #    i=i+1

    # Create plot (fig = plt.figure)
    global ax
    try:
        fig.clf() # Remove old dots
        ax = fig.add_axes([0, 0, 1, 1]) # Add axis again as they were also removed
        ax.set_xlim(xmin, xmax)
        ax.set_ylim(ymin, ymax)
        plt.scatter(lons0, lats0, c=mass0*100, s=2, marker='o', edgecolors=None) 
    except AssertionError as error:
        print(error)
    except:
        print ("Error")

    plt.clim(0,100)
    ax.set_axis_off()
    fig.savefig("files\\" + overlay, transparent=True, format='png')

    return overlay

#============================================================================================0
ourfile = 'Vestmanna'

if __name__ == "__main__":
    if len(sys.argv) > 1:
        ourfile = sys.argv[1]

ourpath = 'C:\\Users\\thors\\Documents\\GitHub\\App4Sea\\src\\main\\webapp\\data\\'
ourext = '.nc'
ourdestext = '.kmz'
pixels = 1024
myMax=10000 # Number of ponts

# Get data from nc-file
ds = NetCDFFile(ourpath + ourfile + ourext)
z=ds.variables['z'][:]
lat = ds.variables['lat'][:]
lon = ds.variables['lon'][:]
mass_oil = ds.variables['mass_oil'][:]
tim = ds.variables['time'][:]
xmin = lon.min()
xmax = lon.max()
ymin = lat.min()
ymax = lat.max()

mx=len(mass_oil)
if mx > myMax:
    mx=myMax

# Log variables
with open("py.log", "w") as f:
    f.truncate()
    print ('Variables:', file=f)
    for vrbl in ds.variables:
        print  (vrbl, end=', ', file=f)
    print  (file=f)
    for vrbl in ds.variables:
        x = ds.variables[vrbl][:]
        print (f"--- {vrbl}[{len(x)}] ---------", file=f)
        print (x, file=f)

    # print z
    #row = 0
    #print ("=== z ==============", file=f)
    #for z_ in z:
    #    #print (f"Row{row}({len(z_)}): ", z_, file=f)
    #    for val in z_[z_==0]:
    #        print (".", end="", file=f)
    #    print (file=f)
    #    row = row + 1

    #print mass_oil
    #row = 0
    #print ("=== Mass Oil ==============", file=f)
    #for msso in mass_oil:
    #    print (f"Row{row}({len(msso)}): ", msso, file=f)
    #    row = row + 1

# Create GoogleEarth figure template
fig, ax = gearth_fig(llcrnrlon=xmin,
                     llcrnrlat=ymin,
                     urcrnrlon=xmax,
                     urcrnrlat=ymax,
                     pixels=pixels)
print (fig)

# Create images
print ()
tot = 0
i = 0
images = []
print ('Images(' + str(len(tim.data)-1) + ")")

while i < len(tim.data)-1:
    try:
        image = odplot(z, lat, lon, mass_oil, tim, i, ourfile + '_' + str(i) + '.png')
        print (image)
        i = i+1
        images.append(image)
    except:
        break

with open("py.log", "a") as f:
    print(f"\nTotal number of dots = {tot}", file=f)

# Create kml and kmz
kml = make_kml(llcrnrlon=xmin, llcrnrlat=ymin,
         urcrnrlon=xmax, urcrnrlat=ymax,
         figs=images, 
         tim = tim,
         colorbar='legend.png',
         kmzfile = ourfile + ourdestext, 
         name=ourfile,
         description='Oil spill drift prediction',
         author = 'Lars R. Hole',
         visibility = 1,
         gxaltitudemode=AltitudeMode.absolute, altitude=1200000)

ds.close()