# TypeScript precompile step

sources = [
  'main.ts',
  'window.ts',
  #'dbus.ts'
]

outputs = []
foreach source : sources
    outputs += source.replace('.ts', '.js')
endforeach

typescript = custom_target(
  'typescript',
  input: files(sources),
  command: [ tsc, '--project', tsconfig, '--outDir', 'output/tsc' ],
  build_by_default: true,
  output: outputs #['main.js', 'window.js'], #'tsc.stamp',
)

pkgdatadir = get_option('datadir') / meson.project_name()

#install_subdir(
#  'build/tsc',
#  install_dir: pkgdatadir
#)

gnome = import('gnome')

src_res = gnome.compile_resources('ca.deobald.Kaya.src',
  'ca.deobald.Kaya.src.gresource.xml',
  dependencies: typescript,
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
)

data_res = gnome.compile_resources('ca.deobald.Kaya.data',
  'ca.deobald.Kaya.data.gresource.xml',
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
)

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
  install_dir: get_option('bindir')
)
