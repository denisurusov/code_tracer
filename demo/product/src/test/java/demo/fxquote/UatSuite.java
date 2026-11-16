package demo.fxquote;

import static io.cucumber.junit.platform.engine.Constants.FEATURES_PROPERTY_NAME;
import static io.cucumber.junit.platform.engine.Constants.GLUE_PROPERTY_NAME;

import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.Suite;

/**
 * Runs tests/features/uat/*.feature against the built jar. Selected explicitly
 * (mvn test -Dtest=UatSuite); excluded from the default unit run. Report plugins
 * come from -Dcucumber.plugin, set by the evidence runner.
 */
@Suite
@IncludeEngines("cucumber")
@ConfigurationParameter(key = FEATURES_PROPERTY_NAME, value = "../tests/features/uat")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME, value = "demo.fxquote.steps")
public class UatSuite {}
