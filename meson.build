project('kaya-gnome',
          version: '0.1.0',
    meson_version: '>= 1.0.0',
  default_options: [ 'warning_level=2', 'werror=false', ],
)

i18n = import('i18n')
gnome = import('gnome')

gjs_dep = dependency('gjs-1.0', version: '>= 1.54.0')
gjs_console = gjs_dep.get_variable(pkgconfig: 'gjs_console')
libadwaita = dependency('libadwaita-1', version: '>= 1.7.0')

tsc = find_program('tsc', required: true)
tsconfig = files('tsconfig.json')

subdir('data')
subdir('src')
subdir('po')

gnome.post_install(
     glib_compile_schemas: true,
    gtk_update_icon_cache: true,
  update_desktop_database: true,
)
