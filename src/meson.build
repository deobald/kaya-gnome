pkgdatadir = get_option('datadir') / meson.project_name()
gnome = import('gnome')

install_subdir(
  'data', # contains main.ui, ca.deobald.Kaya.xml, icons, etc.
  install_dir: pkgdatadir,
)

src_res = gnome.compile_resources(
  'ca.deobald.Kaya.src',
  'ca.deobald.Kaya.src.gresource.xml',
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
)

data_res = gnome.compile_resources(
  'ca.deobald.Kaya.data',
  'ca.deobald.Kaya.data.gresource.xml',
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
)

js_files = ['main.js', 'window.js']
foreach f : js_files
  install_data(f, install_dir: pkgdatadir)
endforeach

bin_conf = configuration_data()
bin_conf.set('GJS', find_program('gjs').full_path())
bin_conf.set('PACKAGE_VERSION', meson.project_version())
bin_conf.set('PACKAGE_NAME', meson.project_name())
bin_conf.set('prefix', get_option('prefix'))
bin_conf.set('libdir', get_option('prefix') / get_option('libdir'))
bin_conf.set('datadir', get_option('prefix') / get_option('datadir'))
bin_conf.set('resource_path', '/ca/deobald/Kaya')

configure_file(
  input: 'ca.deobald.Kaya.in',
  output: 'ca.deobald.Kaya',
  configuration: bin_conf,
  install: true,
  install_dir: get_option('bindir'),
)
