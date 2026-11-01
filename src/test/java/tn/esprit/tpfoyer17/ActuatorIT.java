package tn.esprit.tpfoyer17;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.actuate.observability.AutoConfigureObservability;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The metrics read by Prometheus in the EKS cluster (ServiceMonitor k8s/servicemonitor.yaml):
 * the whole application is started (H2 database) and the actuator endpoints are called like Prometheus does.
 * AutoConfigureObservability: metrics are not exported in tests unless asked.
 */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureObservability
class ActuatorIT {

    @Autowired
    MockMvc mockMvc;

    @Test
    void prometheusEndpoint_exposesHttpAndJvmMetricsWithTheApplicationTag() throws Exception {
        // One API call first, so that an HTTP request metric exists
        mockMvc.perform(get("/api/universites/getAll")).andExpect(status().isOk());

        mockMvc.perform(get("/actuator/prometheus"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("http_server_requests_seconds_count")))
                .andExpect(content().string(containsString("uri=\"/api/universites/getAll\"")))
                .andExpect(content().string(containsString("jvm_memory_used_bytes")))
                .andExpect(content().string(containsString("application=\"tpfoyer\"")));
    }

    @Test
    void healthEndpoint_isUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("\"status\":\"UP\"")));
    }

    @Test
    void otherActuatorEndpoints_areNotExposed() throws Exception {
        // env would show the configuration (database URL...): it must stay hidden
        mockMvc.perform(get("/actuator/env")).andExpect(status().isNotFound());
    }
}
