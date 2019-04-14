#!/usr/bin/env python

from datetime import datetime, timedelta

from opendrift.readers import reader_netCDF_CF_generic
from opendrift.models.openoil3D import OpenOil3D

# NOAA OilLibrary must be installed to run this example
o = OpenOil3D(loglevel=0, weathering_model='noaa')

print(o.oiltypes)  # Print available oil types

# Arome
#reader_arome = reader_netCDF_CF_generic.Reader(o.test_data_folder() + 
#    '16Nov2015_NorKyst_z_surface/arome_subset_16Nov2015.nc')
# Norkyst
#reader_norkyst = reader_netCDF_CF_generic.Reader(o.test_data_folder() + 
#    '16Nov2015_NorKyst_z_surface/norkyst800_subset_16Nov2015.nc')

#reader_norkyst = reader_netCDF_CF_generic.Reader('http://thredds.met.no/thredds/catalog/sea/norkyst800mv0_1h/catalog.html?dataset=norkyst800mv0_1h_files/NorKyst-800m_ZDEPTHS_his.fc.2019*.nc')
#reader_arome = reader_netCDF_CF_generic.Reader('http://thredds.met.no/thredds/dodsC/meps25epsarchive/2019/*/*/meps_sfx_2_5km_2019*T*Z.nc')
#o.add_readers_from_list([
#    'http://data.ncof.co.uk/thredds/dodsC/METOFFICE-GLO-AF-PHYS-HOURLY-CUR',
#    'http://oos.soest.hawaii.edu/thredds/dodsC/hioos/model/atm/ncep_global/NCEP_Global_Atmospheric_Model_best.ncd'])
#o.add_readers_from_list([
#    'http://thredds.met.no/thredds/dodsC/sea/norkyst800mv0_24h_be',
#    'http://thredds.met.no/thredds/dodsC/fou-hi/nordic4km/roms_nordic4.fc.24h.20181228.nc',
#    'http://oos.soest.hawaii.edu/thredds/dodsC/hioos/model/atm/ncep_global/NCEP_Global_Atmospheric_Model_best.ncd'])

o.add_readers_from_list([
    'http://thredds.met.no/thredds/dodsC/sea/nordic4km/24h/aggregate_be',
    'http://oos.soest.hawaii.edu/thredds/dodsC/hioos/model/atm/ncep_global/NCEP_Global_Atmospheric_Model_best.ncd'])
o.fallback_values['x_wind'] = 0  # Constant wind drift
o.fallback_values['y_wind'] = 0
o.fallback_values['x_sea_water_velocity'] = 0  # Constant current
o.fallback_values['y_sea_water_velocity'] = 0
#o.add_reader([reader_norkyst, reader_arome])

# Seeding some particles
lon = 17.9562; lat = 80.0614; # Northguider, 
#time = [reader_arome.start_time,
#        reader_arome.start_time + timedelta(hours=30)]
#time = reader_arome.start_time
#time = datetime(2018, 12, 28, 12, 0, 0)  # x hours after stranding
time = datetime(2019, 03, 28, 12, 0, 0)  # x hours after stranding
# Seed oil elements at defined position and time
o.seed_elements(lon, lat, radius=1, number=3000, time=time, z=0,
		oiltype='MARINE DIESEL OIL, ESSO')                
		#oiltype='GULLFAKS, EXXON')
		#oiltype='ARABIAN MEDIUM, API')
                #oiltype='ALGERIAN CONDENSATE')

# Adjusting some configuration
o.set_config('processes:evaporation',  True)
o.set_config('processes:emulsification',  True)
o.set_config('processes:turbulentmixing',  True)
o.set_config('turbulentmixing:timestep',  5)

# Running model (until end of driver data)
o.run(steps=24*4**5, time_step=900,
      time_step_output=4*3600,
      outfile='northguider.nc')

# Print and plot results
print(o)
o.plot()
o.plot_oil_budget(filename='openoil3d_oil_budget.png')
#o.plot(filename='openoil3d_drift')
o.plot_vertical_distribution()
o.plot_property('water_fraction', mean=True)
o.plot_property('z')
#o.plot_property('mass_evaporated')
#o.plot_property('water_fraction')
#o.plot_property('interfacial_area')
o.animation()
