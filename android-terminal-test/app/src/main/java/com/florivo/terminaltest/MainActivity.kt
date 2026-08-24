package com.florivo.terminaltest

import android.nfc.NfcAdapter
import android.nfc.Tag
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import kotlin.concurrent.thread

private const val SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co"
private const val SUPABASE_PUBLISHABLE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya"
private const val DEVICE_ID = "android-terminal-test-01"
private const val MODE = "live"
private const val CONFIRM_SECONDS = 8L
private const val GRACE_SECONDS = 4L
private const val IDLE_SECONDS = 12L

private val FlorivoBg = Color(0xFF0F2D22)
private val FlorivoBg2 = Color(0xFF1E4935)
private val Card = Color(0xFFFFFDF4)
private val Ink = Color(0xFF203429)
private val Muted = Color(0xFF767364)
private val GreenEdge = Color(0xFF1C5C37)
private val RedEdge = Color(0xFF7D2A25)
private val Yellow = Color(0xFFFFC857)

private data class UserSession(
    val id: String,
    val firstName: String,
    val lastName: String,
    val role: String,
    val photoUrl: String?
) {
    val fullName: String get() = "$firstName $lastName".trim()
    val canEnterQuantity: Boolean get() = role.lowercase() in setOf("produksjon", "admin")
}

private data class Product(val key: String, val name: String, val icon: String, val wide: Boolean = false)

private fun plainNumber(value: String): String {
    val trimmed = value.trim().removePrefix("F-").trimStart('0')
    return trimmed.ifBlank { "0" }
}

private data class RegisterResult(
    val quantity: Int,
    val firstDisplayNumber: String,
    val lastDisplayNumber: String
) {
    val plainFirst: String get() = plainNumber(firstDisplayNumber)
    val plainLast: String get() = plainNumber(lastDisplayNumber)
    val plainRange: String
        get() = if (plainFirst == plainLast) plainFirst else "$plainFirst–$plainLast"
}

private data class RecentRegistration(
    val time: String,
    val productKey: String,
    val quantity: Int,
    val firstNumber: Long,
    val lastNumber: Long
) {
    val numberText: String
        get() = if (firstNumber == lastNumber) firstNumber.toString() else "$firstNumber–$lastNumber"
}

enum class GateState { WAITING, CHECKING, UNKNOWN, ERROR }

class MainActivity : ComponentActivity() {
    private var adapter: NfcAdapter? = null
    private var session by mutableStateOf<UserSession?>(null)
    private var gateState by mutableStateOf(GateState.WAITING)
    private var gateMessage by mutableStateOf("Legg adgangskortet mot terminalen")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        adapter = NfcAdapter.getDefaultAdapter(this)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = FlorivoBg) {
                    FlorivoV08App(
                        session = session,
                        gateState = gateState,
                        gateMessage = gateMessage,
                        nfcAvailable = adapter != null,
                        nfcEnabled = adapter?.isEnabled == true,
                        onLogout = {
                            session = null
                            gateState = GateState.WAITING
                            gateMessage = "Legg adgangskortet mot terminalen"
                        }
                    )
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        adapter?.enableReaderMode(
            this,
            { tag -> handleTag(tag) },
            NfcAdapter.FLAG_READER_NFC_A or NfcAdapter.FLAG_READER_NFC_B or NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK,
            null
        )
    }

    override fun onPause() {
        adapter?.disableReaderMode(this)
        super.onPause()
    }

    private fun handleTag(tag: Tag) {
        val cardHash = sha256(tag.id)
        runOnUiThread {
            gateState = GateState.CHECKING
            gateMessage = "Kontrollerer kort…"
        }
        thread {
            try {
                val user = resolveNfc(cardHash)
                runOnUiThread {
                    if (user != null) {
                        session = user
                        gateState = GateState.WAITING
                        gateMessage = "Kort godkjent"
                    } else {
                        session = null
                        gateState = GateState.UNKNOWN
                        gateMessage = "KORT IKKE REGISTRERT"
                    }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    session = null
                    gateState = GateState.ERROR
                    gateMessage = "FEIL · ${e.message ?: "ukjent feil"}"
                }
            }
        }
    }

    private fun sha256(bytes: ByteArray): String =
        MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
}

@Composable
private fun FlorivoV08App(
    session: UserSession?,
    gateState: GateState,
    gateMessage: String,
    nfcAvailable: Boolean,
    nfcEnabled: Boolean,
    onLogout: () -> Unit
) {
    if (session == null) {
        NfcGate(gateState, gateMessage, nfcAvailable, nfcEnabled)
    } else {
        FlorivoLiveStockApp(session, onLogout)
    }
}

@Composable
private fun NfcGate(state: GateState, message: String, nfcAvailable: Boolean, nfcEnabled: Boolean) {
    Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(FlorivoBg, FlorivoBg2))).padding(16.dp)) {
        Column(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(18.dp)) {
            Header("LIVE")
            Column(
                modifier = Modifier.fillMaxWidth().shadow(8.dp, RoundedCornerShape(24.dp)).background(Card, RoundedCornerShape(24.dp)).padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text("ADGANG", color = Ink, fontSize = 28.sp, fontWeight = FontWeight.Black)
                Text(
                    when {
                        !nfcAvailable -> "Denne telefonen har ikke NFC"
                        !nfcEnabled -> "Slå på NFC i Android"
                        else -> message
                    },
                    color = if (state == GateState.UNKNOWN || state == GateState.ERROR || !nfcEnabled) Color(0xFF9B2E27) else Ink,
                    fontSize = 21.sp,
                    fontWeight = FontWeight.Bold
                )
                Box(
                    modifier = Modifier.fillMaxWidth().height(210.dp).clip(RoundedCornerShape(24.dp))
                        .background(
                            when (state) {
                                GateState.UNKNOWN, GateState.ERROR -> Brush.verticalGradient(listOf(Color(0xFFF2C7BE), Color(0xFFD67E72)))
                                GateState.CHECKING -> Brush.verticalGradient(listOf(Color(0xFFFFE7A7), Color(0xFFFFC857)))
                                else -> Brush.verticalGradient(listOf(Color(0xFFEAF4C0), Color(0xFFAAD887)))
                            }
                        )
                        .border(2.dp, if (state == GateState.UNKNOWN || state == GateState.ERROR) RedEdge else GreenEdge, RoundedCornerShape(24.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(if (state == GateState.UNKNOWN || state == GateState.ERROR) "!" else ")))", fontSize = 54.sp, fontWeight = FontWeight.Black, color = Ink)
                        Text(
                            when (state) {
                                GateState.CHECKING -> "KONTROLLERER"
                                GateState.UNKNOWN -> "KORT IKKE REGISTRERT"
                                GateState.ERROR -> "FEIL"
                                else -> "VENTER PÅ KORT"
                            },
                            color = Ink,
                            fontSize = 21.sp,
                            fontWeight = FontWeight.Black,
                            textAlign = TextAlign.Center
                        )
                    }
                }
                Text("Kortnummer / UID vises ikke. Florivo bruker kun en SHA-256 hash av kort-ID mot serveren.", color = Muted, fontSize = 13.sp, lineHeight = 18.sp)
            }
            Spacer(Modifier.weight(1f))
            Text("Florivo Android v0.8.0 LAST 3 + PLAIN NUMBER · 24.08.2026", modifier = Modifier.fillMaxWidth(), color = Color.White.copy(alpha = 0.72f), fontSize = 11.sp, textAlign = TextAlign.Center)
        }
    }
}

@Composable
private fun FlorivoLiveStockApp(session: UserSession, onLogout: () -> Unit) {
    val scope = rememberCoroutineScope()
    var vrakMode by remember { mutableStateOf(false) }
    var selected by remember { mutableStateOf<Product?>(null) }
    var lastResult by remember { mutableStateOf<RegisterResult?>(null) }
    var sending by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf("KORT GODKJENT · ${session.fullName}") }
    var quantityText by remember { mutableStateOf("") }
    var autoLogoutSignal by remember { mutableIntStateOf(0) }
    var idleSignal by remember { mutableIntStateOf(0) }
    var graceActive by remember { mutableStateOf(false) }
    var recent by remember { mutableStateOf<List<RecentRegistration>>(emptyList()) }

    fun refreshRecent() {
        scope.launch {
            try {
                recent = fetchLast3Today(session.id)
            } catch (_: Exception) {
                // History must never block warehouse registration.
            }
        }
    }

    LaunchedEffect(session.id) {
        refreshRecent()
    }

    LaunchedEffect(idleSignal, selected, sending) {
        if (selected == null && !sending) {
            delay(IDLE_SECONDS * 1000)
            if (selected == null && !sending) onLogout()
        }
    }

    LaunchedEffect(autoLogoutSignal) {
        if (autoLogoutSignal <= 0 || selected == null) return@LaunchedEffect
        graceActive = false
        delay(CONFIRM_SECONDS * 1000)
        selected = null
        lastResult = null
        vrakMode = false
        graceActive = true
        delay(GRACE_SECONDS * 1000)
        onLogout()
    }

    val products = listOf(
        Product("bunner", "BUNNER", "▰", true),
        Product("hyller30", "HYLLER x30", "▤"),
        Product("hyller60", "HYLLER x60", "▤"),
        Product("forlengere_korte", "FORLENGERE KORTE", "↔"),
        Product("forlengere_lange", "FORLENGERE LANGE", "⟷"),
        Product("forlengere_plast", "FORLENGERE PLAST", "◫", true)
    )
    val vrakProducts = listOf(
        Product("vrak_bunner", "VRAK BUNNER", "✕"),
        Product("vrak_hyller", "VRAK HYLLER", "✕"),
        Product("bunner_uten_brikk", "BUNNER UTEN BRIKK", "!", true)
    )

    fun register(product: Product) {
        if (sending) return
        idleSignal++
        autoLogoutSignal++
        graceActive = false
        selected = null
        lastResult = null

        if (product.key == "bunner_uten_brikk") {
            status = "AVVIK · ikke lagerført i denne versjonen"
            return
        }

        val quantity = if (session.canEnterQuantity) {
            quantityText.trim().ifBlank { "1" }.toIntOrNull()
        } else 1

        if (quantity == null || quantity < 1 || quantity > 500) {
            status = "FEIL · ANTALL må være 1–500"
            return
        }

        sending = true
        status = if (quantity == 1) "Registrerer LIVE på lager…" else "Registrerer $quantity stk LIVE på lager…"
        scope.launch {
            try {
                val result = registerStockLiveQty(product.key, quantity, session.id)
                lastResult = result
                selected = product
                status = if (result.quantity == 1) {
                    "PÅ LAGER · ${result.plainRange}"
                } else {
                    "PÅ LAGER · +${result.quantity} ${product.name} · ${result.plainRange}"
                }
                if (session.canEnterQuantity) quantityText = ""
                refreshRecent()
                autoLogoutSignal++
            } catch (e: Exception) {
                status = "FEIL · ${e.message ?: "ukjent feil"}"
            } finally {
                sending = false
            }
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(FlorivoBg, FlorivoBg2)))) {
        Column(modifier = Modifier.fillMaxSize().padding(horizontal = 10.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            Header("LIVE")
            Column(
                modifier = Modifier.fillMaxWidth().shadow(8.dp, RoundedCornerShape(22.dp)).background(Card, RoundedCornerShape(22.dp)).padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(7.dp)
            ) {
                EmployeeCard(session, onLogout)

                if (session.canEnterQuantity) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text("ANTALL", color = Ink, fontSize = 14.sp, fontWeight = FontWeight.Black)
                        OutlinedTextField(
                            value = quantityText,
                            onValueChange = { value ->
                                if (value.length <= 3 && value.all { it.isDigit() }) {
                                    quantityText = value
                                    idleSignal++
                                }
                            },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            label = { Text("1–500") },
                            placeholder = { Text("1", color = Muted) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Ink,
                                unfocusedTextColor = Ink,
                                cursorColor = GreenEdge,
                                focusedBorderColor = GreenEdge,
                                unfocusedBorderColor = Muted,
                                focusedLabelColor = GreenEdge,
                                unfocusedLabelColor = Muted
                            )
                        )
                    }
                }

                if (!vrakMode) {
                    CompactProductGrid(products, enabled = !sending) { register(it) }
                    FlorivoActionButton("VRAK / AVVIK", "!", danger = true, enabled = !sending, modifier = Modifier.fillMaxWidth().height(58.dp)) {
                        idleSignal++
                        vrakMode = true
                    }
                } else {
                    Text("VRAK / AVVIK", modifier = Modifier.fillMaxWidth(), color = Color(0xFF8A2C27), fontSize = 20.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center)
                    CompactProductGrid(vrakProducts, danger = true, enabled = !sending) { register(it) }
                    FlorivoActionButton("TILBAKE", "←", enabled = !sending, modifier = Modifier.fillMaxWidth().height(58.dp)) {
                        idleSignal++
                        vrakMode = false
                    }
                }
            }

            Text(
                if (graceActive) "4 SEK · velg nytt produkt eller økten avsluttes" else status,
                modifier = Modifier.fillMaxWidth(),
                color = if (status.startsWith("FEIL")) Color(0xFFFFB4AC) else Color(0xFFD7E7DA),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                maxLines = 1
            )

            RecentRegistrationsCard(recent)
        }

        if (selected != null && lastResult != null) {
            ConfirmationOverlay(selected!!, lastResult!!, selected!!.key.startsWith("vrak_"))
        }
    }
}

@Composable
private fun Header(badge: String) {
    Row(modifier = Modifier.fillMaxWidth().height(54.dp), verticalAlignment = Alignment.CenterVertically) {
        Text("FLORIVO TERMINAL", modifier = Modifier.weight(1f), color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black, maxLines = 1)
        Box(modifier = Modifier.clip(RoundedCornerShape(50)).background(Yellow).border(1.dp, Color(0xFFFFE09A), RoundedCornerShape(50)).padding(horizontal = 13.dp, vertical = 7.dp)) {
            Text(badge, color = Color(0xFF3A2A00), fontSize = 12.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun EmployeeCard(session: UserSession, onLogout: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().height(66.dp).background(Color.White, RoundedCornerShape(16.dp)).border(1.dp, Color(0xFFDED7B6), RoundedCornerShape(16.dp)).clickable { onLogout() }.padding(horizontal = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier.clip(RoundedCornerShape(50)).background(Yellow).padding(horizontal = 12.dp, vertical = 8.dp), contentAlignment = Alignment.Center) {
            Text("NFC", color = Color(0xFF3A2A00), fontSize = 11.sp, fontWeight = FontWeight.Black)
        }
        Column(modifier = Modifier.weight(1f).padding(start = 10.dp)) {
            Text(session.fullName.uppercase(), color = Ink, fontSize = 15.sp, fontWeight = FontWeight.Black, maxLines = 1)
            Text("${session.role} · KORT GODKJENT", color = Muted, fontSize = 10.sp)
        }
        Text("BYTT", color = GreenEdge, fontSize = 10.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun RecentRegistrationsCard(items: List<RecentRegistration>) {
    val shape = RoundedCornerShape(18.dp)
    Column(
        modifier = Modifier.fillMaxWidth().background(Color(0x332C6849), shape).border(1.dp, Color(0x557FB394), shape).padding(horizontal = 12.dp, vertical = 9.dp),
        verticalArrangement = Arrangement.spacedBy(5.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("◷", color = Yellow, fontSize = 18.sp, fontWeight = FontWeight.Black)
            Text("SISTE 3 I DAG", modifier = Modifier.padding(start = 8.dp), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black)
        }

        if (items.isEmpty()) {
            Text("Ingen registreringer i dag", color = Color.White.copy(alpha = 0.68f), fontSize = 11.sp)
        } else {
            items.forEachIndexed { index, item ->
                if (index > 0) {
                    Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Color.White.copy(alpha = 0.10f)))
                }
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text(item.time, color = Color.White, fontSize = 11.sp)
                    Text(" · ", color = Color.White.copy(alpha = 0.65f), fontSize = 11.sp)
                    Text(productLabel(item.productKey), modifier = Modifier.weight(1f), color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                    Text(if (item.quantity >= 0) "+${item.quantity}" else item.quantity.toString(), color = Color(0xFF83D78F), fontSize = 11.sp, fontWeight = FontWeight.Black)
                    Text(" · ", color = Color.White.copy(alpha = 0.65f), fontSize = 11.sp)
                    Text(item.numberText, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

private fun productLabel(key: String): String = when (key) {
    "bunner" -> "BUNNER"
    "hyller30" -> "HYLLER x30"
    "hyller60" -> "HYLLER x60"
    "forlengere_korte" -> "FORLENGERE KORTE"
    "forlengere_lange" -> "FORLENGERE LANGE"
    "forlengere_plast" -> "FORLENGERE PLAST"
    "vrak_bunner" -> "VRAK BUNNER"
    "vrak_hyller" -> "VRAK HYLLER"
    "bunner_uten_brikk" -> "BUNNER UTEN BRIKK"
    else -> key.uppercase()
}

@Composable
private fun CompactProductGrid(products: List<Product>, danger: Boolean = false, enabled: Boolean = true, onClick: (Product) -> Unit) {
    var i = 0
    while (i < products.size) {
        val first = products[i]
        if (first.wide) {
            FlorivoActionButton(first.name, first.icon, danger = danger, enabled = enabled, modifier = Modifier.fillMaxWidth().height(66.dp)) { onClick(first) }
            i++
        } else {
            val second = products.getOrNull(i + 1)?.takeIf { !it.wide }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                FlorivoActionButton(first.name, first.icon, danger = danger, enabled = enabled, modifier = Modifier.weight(1f).height(74.dp)) { onClick(first) }
                if (second != null) {
                    FlorivoActionButton(second.name, second.icon, danger = danger, enabled = enabled, modifier = Modifier.weight(1f).height(74.dp)) { onClick(second) }
                } else {
                    Spacer(Modifier.weight(1f))
                }
            }
            i += if (second != null) 2 else 1
        }
    }
}

@Composable
private fun FlorivoActionButton(
    text: String,
    icon: String,
    modifier: Modifier = Modifier,
    danger: Boolean = false,
    enabled: Boolean = true,
    onClick: () -> Unit
) {
    val shape = RoundedCornerShape(18.dp)
    val colors = if (danger) {
        listOf(Color(0xFFCF6159), Color(0xFFAA403A), Color(0xFF86302B))
    } else {
        listOf(Color(0xFF3F9557), Color(0xFF2F7E49), Color(0xFF276A40))
    }
    Box(
        modifier = modifier.shadow(4.dp, shape).clip(shape).background(Brush.horizontalGradient(colors))
            .border(1.5.dp, if (danger) RedEdge else GreenEdge, shape)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Row(modifier = Modifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically) {
            Text(icon, color = Color.White.copy(alpha = if (enabled) 0.92f else 0.55f), fontSize = 22.sp, fontWeight = FontWeight.Black)
            Text(
                text,
                modifier = Modifier.weight(1f).padding(start = 9.dp),
                color = Color.White.copy(alpha = if (enabled) 1f else 0.55f),
                fontSize = if (text.length > 16) 14.sp else 17.sp,
                fontWeight = FontWeight.Black,
                lineHeight = 17.sp,
                maxLines = 2
            )
        }
    }
}

@Composable
private fun ConfirmationOverlay(product: Product, result: RegisterResult, danger: Boolean) {
    Box(modifier = Modifier.fillMaxSize().background(Color(0xE80B2017)).padding(22.dp), contentAlignment = Alignment.Center) {
        Column(
            modifier = Modifier.fillMaxWidth().shadow(12.dp, RoundedCornerShape(28.dp))
                .background(
                    if (danger) Brush.verticalGradient(listOf(Color(0xFFCF635B), Color(0xFF8E332E)))
                    else Brush.verticalGradient(listOf(Color(0xFFE7F29A), Color(0xFF79B767), Color(0xFF356E45))),
                    RoundedCornerShape(28.dp)
                )
                .border(2.dp, if (danger) RedEdge else GreenEdge, RoundedCornerShape(28.dp))
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(if (danger) "!" else "✓", fontSize = 56.sp, fontWeight = FontWeight.Black, color = Color.White)
            Text("REGISTRERT PÅ LAGER", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center)
            if (result.quantity > 1) {
                Text("+${result.quantity} stk", color = Color.White, fontSize = 44.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 6.dp))
                Text(result.plainRange, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
            } else {
                Text(result.plainRange, color = Color.White, fontSize = 58.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(vertical = 6.dp))
            }
            Text(product.name, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
            Text("mode=live · NFC-bruker · 8 sek + 4 sek til auto-utlogging", color = Color.White.copy(alpha = 0.90f), fontSize = 11.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 12.dp))
        }
    }
}

private fun resolveNfc(cardHash: String): UserSession? {
    val url = URL("$SUPABASE_URL/rest/v1/rpc/florivo_terminal_resolve_nfc")
    val connection = (url.openConnection() as HttpURLConnection).apply {
        requestMethod = "POST"
        connectTimeout = 10000
        readTimeout = 10000
        doOutput = true
        setRequestProperty("Content-Type", "application/json")
        setRequestProperty("Accept", "application/json")
        setRequestProperty("apikey", SUPABASE_PUBLISHABLE_KEY)
    }
    val payload = JSONObject().put("p_card_hash", cardHash).put("p_device_id", DEVICE_ID).toString()
    connection.outputStream.use { it.write(payload.toByteArray(Charsets.UTF_8)) }
    val code = connection.responseCode
    val stream = if (code in 200..299) connection.inputStream else connection.errorStream
    val body = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
    connection.disconnect()
    if (code !in 200..299) throw IllegalStateException("HTTP $code ${body.take(120).replace('\n',' ')}")
    val array = JSONArray(body)
    if (array.length() == 0) return null
    val row = array.getJSONObject(0)
    return UserSession(
        id = row.optString("user_id"),
        firstName = row.optString("first_name"),
        lastName = row.optString("last_name"),
        role = row.optString("role", "lager"),
        photoUrl = row.optString("photo_url").takeIf { it.isNotBlank() && it != "null" }
    )
}

private suspend fun registerStockLiveQty(
    productKey: String,
    quantity: Int,
    userId: String
): RegisterResult = withContext(Dispatchers.IO) {
    val url = URL("$SUPABASE_URL/rest/v1/rpc/florivo_terminal_register_stock_qty")
    val connection = (url.openConnection() as HttpURLConnection).apply {
        requestMethod = "POST"
        connectTimeout = 15000
        readTimeout = 20000
        doOutput = true
        setRequestProperty("Content-Type", "application/json")
        setRequestProperty("Accept", "application/json")
        setRequestProperty("apikey", SUPABASE_PUBLISHABLE_KEY)
    }
    val payload = JSONObject()
        .put("p_mode", MODE)
        .put("p_product_key", productKey)
        .put("p_quantity", quantity)
        .put("p_device_id", DEVICE_ID)
        .put("p_user_id", userId)
        .toString()
    connection.outputStream.use { it.write(payload.toByteArray(Charsets.UTF_8)) }
    val code = connection.responseCode
    val stream = if (code in 200..299) connection.inputStream else connection.errorStream
    val body = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
    connection.disconnect()
    if (code !in 200..299) throw IllegalStateException("HTTP $code ${body.take(180).replace('\n',' ')}")
    val array = JSONArray(body)
    if (array.length() == 0) throw IllegalStateException("Tomt serversvar")
    val row = array.getJSONObject(0)
    return@withContext RegisterResult(
        quantity = row.optInt("quantity", quantity),
        firstDisplayNumber = row.optString("first_display_number", "------"),
        lastDisplayNumber = row.optString("last_display_number", "------")
    )
}

private suspend fun fetchLast3Today(userId: String): List<RecentRegistration> = withContext(Dispatchers.IO) {
    val url = URL("$SUPABASE_URL/rest/v1/rpc/florivo_terminal_last3_today")
    val connection = (url.openConnection() as HttpURLConnection).apply {
        requestMethod = "POST"
        connectTimeout = 10000
        readTimeout = 10000
        doOutput = true
        setRequestProperty("Content-Type", "application/json")
        setRequestProperty("Accept", "application/json")
        setRequestProperty("apikey", SUPABASE_PUBLISHABLE_KEY)
    }
    val payload = JSONObject().put("p_user_id", userId).put("p_mode", MODE).toString()
    connection.outputStream.use { it.write(payload.toByteArray(Charsets.UTF_8)) }
    val code = connection.responseCode
    val stream = if (code in 200..299) connection.inputStream else connection.errorStream
    val body = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
    connection.disconnect()
    if (code !in 200..299) throw IllegalStateException("HTTP $code")
    val array = JSONArray(body)
    buildList {
        for (i in 0 until array.length()) {
            val row = array.getJSONObject(i)
            add(
                RecentRegistration(
                    time = row.optString("local_time", "--:--"),
                    productKey = row.optString("product_key", ""),
                    quantity = row.optInt("qty", 1),
                    firstNumber = row.optLong("first_number", 0L),
                    lastNumber = row.optLong("last_number", row.optLong("first_number", 0L))
                )
            )
        }
    }
}
