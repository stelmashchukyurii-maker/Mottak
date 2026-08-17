package com.florivo.terminaltest

import android.nfc.NfcAdapter
import android.nfc.Tag
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : ComponentActivity(), NfcAdapter.ReaderCallback {

    private val uidText = mutableStateOf("—")
    private val techText = mutableStateOf("—")
    private val employeeText = mutableStateOf("Venter på kort")
    private val serverText = mutableStateOf("TEST-server: klar")
    private val readCount = mutableIntStateOf(0)
    private val nfcEnabled = mutableStateOf(false)

    private var nfcAdapter: NfcAdapter? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        nfcAdapter = NfcAdapter.getDefaultAdapter(this)
        nfcEnabled.value = nfcAdapter?.isEnabled == true

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = Color(0xFF29281E)) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color(0xFF29281E))
                            .padding(16.dp),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "FLORIVO TERMINAL",
                            color = Color.White,
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Black
                        )
                        Text(
                            text = "NATIVE NFC · TEST v0.1",
                            color = Color(0xFFFFD43B),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(Modifier.height(22.dp))

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFFFFF5C7), RoundedCornerShape(26.dp))
                                .padding(24.dp)
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(text = "📶", fontSize = 64.sp)
                                Text(
                                    text = if (nfcEnabled.value) "Legg kortet mot telefonen" else "NFC er ikke aktiv",
                                    color = Color(0xFF352E0B),
                                    fontSize = 26.sp,
                                    fontWeight = FontWeight.Black,
                                    textAlign = TextAlign.Center
                                )
                                Spacer(Modifier.height(14.dp))
                                Text(
                                    text = employeeText.value,
                                    color = Color(0xFF6A5810),
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center
                                )
                                Spacer(Modifier.height(18.dp))
                                Text(
                                    text = "UID: ${uidText.value}",
                                    color = Color(0xFF3B330F),
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center
                                )
                                Text(
                                    text = "TECH: ${techText.value}",
                                    color = Color(0xFF6E6540),
                                    fontSize = 13.sp,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(top = 8.dp)
                                )
                                Text(
                                    text = "Lesinger: ${readCount.intValue}",
                                    color = Color(0xFF6E6540),
                                    fontSize = 13.sp,
                                    modifier = Modifier.padding(top = 8.dp)
                                )
                                Text(
                                    text = serverText.value,
                                    color = Color(0xFF6E6540),
                                    fontSize = 13.sp,
                                    modifier = Modifier.padding(top = 8.dp)
                                )
                            }
                        }

                        Spacer(Modifier.height(22.dp))

                        Button(
                            onClick = {
                                uidText.value = "—"
                                techText.value = "—"
                                employeeText.value = "Venter på kort"
                                serverText.value = "TEST-server: klar"
                                readCount.intValue = 0
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(72.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFFFFD43B),
                                contentColor = Color(0xFF332B08)
                            ),
                            shape = RoundedCornerShape(20.dp)
                        ) {
                            Text("RESET TEST", fontSize = 20.sp, fontWeight = FontWeight.Black)
                        }
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        nfcEnabled.value = nfcAdapter?.isEnabled == true
        val flags = NfcAdapter.FLAG_READER_NFC_A or
            NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK or
            NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS
        nfcAdapter?.enableReaderMode(this, this, flags, null)
    }

    override fun onPause() {
        nfcAdapter?.disableReaderMode(this)
        super.onPause()
    }

    override fun onTagDiscovered(tag: Tag) {
        val uid = tag.id.joinToString(":") { byte -> "%02X".format(byte.toInt() and 0xFF) }
        val tech = tag.techList.joinToString(", ") { it.substringAfterLast('.') }

        runOnUiThread {
            uidText.value = uid
            techText.value = tech
            employeeText.value = "Kort lest · søker ansatt…"
            serverText.value = "TEST-server: søker"
            readCount.intValue += 1
        }

        lookupEmployee(uid)
    }

    private fun lookupEmployee(uid: String) {
        Thread {
            try {
                val connection = (URL("$SUPABASE_URL/rest/v1/rpc/florivo_terminal_test_lookup_uid")
                    .openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 5000
                    readTimeout = 5000
                    doOutput = true
                    setRequestProperty("apikey", SUPABASE_KEY)
                    setRequestProperty("Authorization", "Bearer $SUPABASE_KEY")
                    setRequestProperty("Content-Type", "application/json")
                }

                val body = JSONObject().put("p_uid", uid).toString()
                connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }

                val code = connection.responseCode
                val stream = if (code in 200..299) connection.inputStream else connection.errorStream
                val response = stream?.bufferedReader()?.use { it.readText() }.orEmpty()

                if (code in 200..299) {
                    val array = JSONArray(response)
                    val employee = if (array.length() > 0) {
                        array.getJSONObject(0).optString("employee_name", "")
                    } else ""
                    runOnUiThread {
                        employeeText.value = if (employee.isBlank()) "UKJENT KORT" else employee
                        serverText.value = "TEST-server: OK"
                    }
                } else {
                    runOnUiThread {
                        employeeText.value = "Kort lest"
                        serverText.value = "TEST-server feil HTTP $code"
                    }
                }
                connection.disconnect()
            } catch (e: Exception) {
                runOnUiThread {
                    employeeText.value = "Kort lest"
                    serverText.value = "TEST-server feil: ${e.javaClass.simpleName}"
                }
            }
        }.start()
    }

    companion object {
        private const val SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co"
        private const val SUPABASE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya"
    }
}
