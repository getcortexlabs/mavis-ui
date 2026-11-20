require 'xcodeproj'
require 'fileutils'

directory = File.expand_path(ARGV.fetch(0))
FileUtils.mkdir_p(directory)
project = Xcodeproj::Project.new(File.join(directory, 'MavisInput.xcodeproj'))
target = project.new_target(:ui_test_bundle, 'MavisInputTests', :ios, '15.0')
reference = project.main_group.new_file(File.expand_path('../test/native-input/TouchTests.swift', __dir__))
target.source_build_phase.add_file_reference(reference)
target.build_configurations.each do |config|
  config.build_settings.merge!({
    'PRODUCT_BUNDLE_IDENTIFIER' => 'com.getcortexlabs.mavis.input-tests',
    'SWIFT_VERSION' => '5.0',
    'GENERATE_INFOPLIST_FILE' => 'YES',
    'CODE_SIGNING_ALLOWED' => 'NO',
    'SUPPORTED_PLATFORMS' => 'iphonesimulator',
    'TARGETED_DEVICE_FAMILY' => '1,2',
  })
end
project.save
scheme = Xcodeproj::XCScheme.new
scheme.add_build_target(target)
scheme.add_test_target(target)
scheme.save_as(project.path, 'MavisInputTests', true)
