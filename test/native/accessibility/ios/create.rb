require 'xcodeproj'

path = ARGV.fetch(0)
project = Xcodeproj::Project.new(File.join(path, 'Audit.xcodeproj'))
target = project.new_target(:ui_test_bundle, 'Audit', :ios, '27.0')
target.source_build_phase.add_file_reference(project.main_group.new_file('Audit.m'))
target.build_configurations.each do |config|
  config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.getcortexlabs.mavis.accessibility-tests'
  config.build_settings['GENERATE_INFOPLIST_FILE'] = 'YES'
  config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
  config.build_settings['TARGETED_DEVICE_FAMILY'] = '1,2'
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(target)
scheme.add_test_target(target)
scheme.save_as(File.join(path, 'Audit.xcodeproj'), 'Audit', true)
