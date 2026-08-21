package com.florivo.terminaltest

import android.nfc.NfcAdapter
import android.nfc.Tag
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

private data class NfcCardEvent(
    val cardType: String,
    val technology: String,
    val timestamp: Long = System.currentTimeMillis()
)

class MainActivity : ComponentActivity() {
    private var nfcEvent by mutableStateOf<NfcCardEvent?>(null)
    private var nfcAvailable by mutableStateOf(false)
    private var nfcEnabled by mutableStateOf(false)
    private var adapter: NfcAdapter? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        adapter = NfcAdapter.getDefaultAdapter(this)
        refreshNfcState()

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = FlorivoBg) {
                    FlorivoNfcTestApp(
                        event = nfcEvent,
                        nfcAvailable = nfcAvailable,
                        nfcEnabled = nfcEnabled,
                        onClear = { nfcEvent = null }
                    )
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        refreshNfcState()
        adapter?.enableReaderMode(
            this,
            { tag ->
                val event = describeTag(tag)
                runOnUiThread { nfcEvent = event }
            },
            NfcAdapter.FLAG_READER_NFC_A or
                NfcAdapter.FLAG_READER_NFC_B or
                NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK,
            null
        )
    }

    override fun onPause() {
        adapter?.disableReaderMode(this)
        super.onPause()
    }

    private fun refreshNfcState() {
        nfcAvailable = adapter != null
        nfcEnabled = adapter?.isEnabled == true
    }

    private fun describeTag(tag: Tag): NfcCardEvent {
        val tech = tag.techList.toList()
        return when {
            tech.any { it.endsWith("MifareClassic") } -> NfcCardEvent(
                cardType = "MIFARE Classic",
                technology = "ISO 14443-3A · NfcA"
            )
            tech.any { it.endsWith("IsoDep") } -> NfcCardEvent(
                cardType = "MIFARE Plus / ISO-DEP",
                technology = "ISO 14443-4 · IsoDep · NfcA"
            )
            tech.any { it.endsWith("NfcA") } -> NfcCardEvent(
                cardType = "NFC-A",
                technology = "ISO 14443-A"
            )
            tech.any { it.endsWith("NfcB") } -> NfcCardEvent(
                cardType = "NFC-B",
                technology = "ISO 14443-B"
            )
            else -> NfcCardEvent(
                cardType = "NFC-kort",
                technology = "Kort funnet"
            )
        }
    }
}

private val FlorivoBg = Color(0xFF0F2D22)
private val FlorivoBg2 = Color(0xFF1E4935)
private val Cream = Color(0xFFFFFDF4)
private val Ink = Color(0xFF203429)
private val Muted = Color(0xFF777365)
private val Green = Color(0xFF2F7E49)
private val GreenDark = Color(0xFF1C5C37)
private val Yellow = Color(0xFFFFC857)

@Composable
private fun FlorivoNfcTestApp(
    event: NfcCardEvent?,
    nfcAvailable: Boolean,
    nfcEnabled: Boolean,
    onClear: () -> Unit
) {
    LaunchedEffect(event?.timestamp) {
        if (event != null) {
            delay(4500)
            onClear()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(FlorivoBg, FlorivoBg2)))
            .padding(horizontal = 14.dp, vertical = 14.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Header()

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(8.dp, RoundedCornerShape(24.dp))
                    .background(Cream, RoundedCornerShape(24.dp))
                    .padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "NFC TEST",
                    color = Ink,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Black
                )

                Text(
                    text = when {
                        !nfcAvailable -> "Denne telefonen har ikke NFC"
                        !nfcEnabled -> "Slå på NFC i Android"
                        else -> "Legg adgangskortet mot baksiden av telefonen"
                    },
                    color = if (nfcEnabled) Ink else Color(0xFF9B2E27),
                    fontSize = 19.sp,
                    lineHeight = 25.sp,
                    fontWeight = FontWeight.Bold
                )

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .clip(RoundedCornerShape(24.dp))
                        .background(
                            Brush.verticalGradient(
                                if (nfcEnabled) listOf(Color(0xFFEAF4C0), Color(0xFFAAD887))
                                else listOf(Color(0xFFF3E6DF), Color(0xFFE0BDB2))
                            )
                        )
                        .border(2.dp, if (nfcEnabled) GreenDark else Color(0xFF9B2E27), RoundedCornerShape(24.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = if (nfcEnabled) ")))" else "!",
                            color = if (nfcEnabled) GreenDark else Color(0xFF9B2E27),
                            fontSize = 48.sp,
                            fontWeight = FontWeight.Black
                        )
                        Text(
                            text = if (nfcEnabled) "VENTER PÅ KORT" else "NFC IKKE KLAR",
                            color = Ink,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }

                Text(
                    text = "Sikkerhet: Kortnummer / UID vises ikke på skjermen og lagres ikke i denne testversjonen.",
                    color = Muted,
                    fontSize = 13.sp,
                    lineHeight = 18.sp
                )
            }

            Spacer(modifier = Modifier.weight(1f))

            Text(
                text = "Florivo Android v0.5 NFC TEST · 21.08.2026",
                modifier = Modifier.fillMaxWidth(),
                color = Color.White.copy(alpha = 0.75f),
                fontSize = 11.sp,
                textAlign = TextAlign.Center
            )
        }

        event?.let {
            NfcSuccessOverlay(it)
        }
    }
}

@Composable
private fun Header() {
    Row(
        modifier = Modifier.fillMaxWidth().height(56.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "FLORIVO TERMINAL",
            modifier = Modifier.weight(1f),
            color = Color.White,
            fontSize = 25.sp,
            fontWeight = FontWeight.Black
        )
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(50))
                .background(Yellow)
                .padding(horizontal = 14.dp, vertical = 8.dp)
        ) {
            Text("TEST", color = Color(0xFF3A2A00), fontSize = 12.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun NfcSuccessOverlay(event: NfcCardEvent) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xE80B2017))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(14.dp, RoundedCornerShape(28.dp))
                .background(
                    Brush.verticalGradient(listOf(Color(0xFFE7F29A), Color(0xFF79B767), Color(0xFF356E45))),
                    RoundedCornerShape(28.dp)
                )
                .border(2.dp, GreenDark, RoundedCornerShape(28.dp))
                .padding(horizontal = 24.dp, vertical = 30.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("✓", color = Color.White, fontSize = 62.sp, fontWeight = FontWeight.Black)
            Text("KORT FUNNET", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.Black)
            Text(
                text = event.cardType,
                color = Color.White,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 8.dp)
            )
            Text(
                text = event.technology,
                color = Color.White.copy(alpha = 0.9f),
                fontSize = 13.sp,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 5.dp)
            )
            Text(
                text = "Kort-ID skjult",
                color = Color.White,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 18.dp)
            )
        }
    }
}
