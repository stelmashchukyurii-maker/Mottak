package com.florivo.terminaltest

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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
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

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = FlorivoBg) {
                    FlorivoLiveStockApp()
                }
            }
        }
    }
}

private const val SUPABASE_URL = "https://hzjsatehehhpgpskckfi.supabase.co"
private const val SUPABASE_PUBLISHABLE_KEY = "sb_publishable_5swzjbs4yq7N8sDNR00FHA_n1xbnMya"
private const val DEVICE_ID = "android-terminal-test-01"
private const val MODE = "live"

private val FlorivoBg = Color(0xFF0F2D22)
private val FlorivoBg2 = Color(0xFF1E4935)
private val Card = Color(0xFFFFFDF4)
private val Ink = Color(0xFF203429)
private val Muted = Color(0xFF767364)
private val GreenEdge = Color(0xFF1C5C37)
private val RedEdge = Color(0xFF7D2A25)

private data class Product(
    val key: String,
    val name: String,
    val icon: String,
    val wide: Boolean = false
)

private data class RegisterResult(val displayNumber: String)

@Composable
private fun FlorivoLiveStockApp() {
    val scope = rememberCoroutineScope()
    var vrakMode by remember { mutableStateOf(false) }
    var selected by remember { mutableStateOf<Product?>(null) }
    var displayNumber by remember { mutableStateOf("") }
    var sending by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf("LAGER LIVE · mode=live") }

    LaunchedEffect(selected) {
        if (selected != null) {
            delay(8000)
            selected = null
            displayNumber = ""
            vrakMode = false
        }
    }

    val products = listOf(
        Product("bunner", "BUNNER", "▰", wide = true),
        Product("hyller30", "HYLLER x30", "▤"),
        Product("hyller60", "HYLLER x60", "▤"),
        Product("forlengere_korte", "FORLENGERE KORTE", "↔"),
        Product("forlengere_lange", "FORLENGERE LANGE", "⟷"),
        Product("forlengere_plast", "FORLENGERE PLAST", "◫", wide = true)
    )

    val vrakProducts = listOf(
        Product("vrak_bunner", "VRAK BUNNER", "✕"),
        Product("vrak_hyller", "VRAK HYLLER", "✕"),
        Product("bunner_uten_brikk", "BUNNER UTEN BRIKK", "!", wide = true)
    )

    fun register(product: Product) {
        if (sending) return
        if (product.key == "bunner_uten_brikk") {
            status = "AVVIK · ikke lagerført i denne versjonen"
            return
        }
        sending = true
        status = "Registrerer LIVE på lager…"
        scope.launch {
            try {
                val result = registerStockLive(product.key)
                displayNumber = result.displayNumber
                selected = product
                status = "PÅ LAGER · F-${result.displayNumber}"
            } catch (e: Exception) {
                status = "FEIL · ${e.message ?: "ukjent feil"}"
            } finally {
                sending = false
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(FlorivoBg, FlorivoBg2)))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 10.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(7.dp)
        ) {
            Header()

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(8.dp, RoundedCornerShape(22.dp))
                    .background(Card, RoundedCornerShape(22.dp))
                    .padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(7.dp)
            ) {
                EmployeeCard()

                if (!vrakMode) {
                    CompactProductGrid(products, enabled = !sending) { register(it) }
                    FlorivoActionButton(
                        text = "VRAK / AVVIK",
                        icon = "!",
                        danger = true,
                        enabled = !sending,
                        modifier = Modifier.fillMaxWidth().height(58.dp),
                        onClick = { vrakMode = true }
                    )
                } else {
                    Text(
                        text = "VRAK / AVVIK",
                        modifier = Modifier.fillMaxWidth(),
                        color = Color(0xFF8A2C27),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black,
                        textAlign = TextAlign.Center
                    )
                    CompactProductGrid(vrakProducts, danger = true, enabled = !sending) { register(it) }
                    FlorivoActionButton(
                        text = "TILBAKE",
                        icon = "←",
                        enabled = !sending,
                        modifier = Modifier.fillMaxWidth().height(58.dp),
                        onClick = { vrakMode = false }
                    )
                }
            }

            Text(
                text = status,
                modifier = Modifier.fillMaxWidth(),
                color = if (status.startsWith("FEIL")) Color(0xFFFFB4AC) else Color(0xFFD7E7DA),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
                maxLines = 1
            )
        }

        selected?.let { product ->
            ConfirmationOverlay(
                product = product,
                number = displayNumber,
                danger = product.key.startsWith("vrak_")
            )
        }
    }
}

@Composable
private fun Header() {
    Row(
        modifier = Modifier.fillMaxWidth().height(54.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "FLORIVO TERMINAL",
            modifier = Modifier.weight(1f),
            color = Color.White,
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            maxLines = 1
        )
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(50))
                .background(Color(0xFFFFC857))
                .border(1.dp, Color(0xFFFFE09A), RoundedCornerShape(50))
                .padding(horizontal = 13.dp, vertical = 7.dp)
        ) {
            Text("LIVE", color = Color(0xFF3A2A00), fontSize = 12.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun EmployeeCard() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(62.dp)
            .background(Color.White, RoundedCornerShape(16.dp))
            .border(1.dp, Color(0xFFDED7B6), RoundedCornerShape(16.dp))
            .padding(horizontal = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(50))
                .background(Color(0xFFFFC857))
                .border(1.dp, Color(0xFFD99A00), RoundedCornerShape(50))
                .padding(horizontal = 12.dp, vertical = 8.dp),
            contentAlignment = Alignment.Center
        ) {
            Text("LIVE", color = Color(0xFF3A2A00), fontSize = 11.sp, fontWeight = FontWeight.Black)
        }
        Column(modifier = Modifier.padding(start = 10.dp)) {
            Text("UTEN KORT · LIVE", color = Ink, fontSize = 15.sp, fontWeight = FontWeight.Black)
            Text("Android-knapp → lager · RFID kan bindes senere", color = Muted, fontSize = 10.sp)
        }
    }
}

@Composable
private fun CompactProductGrid(
    products: List<Product>,
    danger: Boolean = false,
    enabled: Boolean = true,
    onClick: (Product) -> Unit
) {
    var index = 0
    while (index < products.size) {
        val first = products[index]
        if (first.wide) {
            FlorivoActionButton(
                text = first.name,
                icon = first.icon,
                danger = danger,
                enabled = enabled,
                modifier = Modifier.fillMaxWidth().height(66.dp),
                onClick = { onClick(first) }
            )
            index += 1
        } else {
            val second = products.getOrNull(index + 1)?.takeIf { !it.wide }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                FlorivoActionButton(
                    text = first.name,
                    icon = first.icon,
                    danger = danger,
                    enabled = enabled,
                    modifier = Modifier.weight(1f).height(74.dp),
                    onClick = { onClick(first) }
                )
                if (second != null) {
                    FlorivoActionButton(
                        text = second.name,
                        icon = second.icon,
                        danger = danger,
                        enabled = enabled,
                        modifier = Modifier.weight(1f).height(74.dp),
                        onClick = { onClick(second) }
                    )
                } else {
                    Spacer(Modifier.weight(1f))
                }
            }
            index += if (second != null) 2 else 1
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
    val edge = if (danger) RedEdge else GreenEdge

    Box(
        modifier = modifier
            .shadow(4.dp, shape)
            .clip(shape)
            .background(Brush.horizontalGradient(colors))
            .border(1.5.dp, edge, shape)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Row(modifier = Modifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically) {
            Text(icon, color = Color.White.copy(alpha = if (enabled) 0.92f else 0.55f), fontSize = 22.sp, fontWeight = FontWeight.Black)
            Text(
                text = text,
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
private fun ConfirmationOverlay(product: Product, number: String, danger: Boolean) {
    Box(
        modifier = Modifier.fillMaxSize().background(Color(0xE80B2017)).padding(22.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .shadow(12.dp, RoundedCornerShape(28.dp))
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
            Text("F-$number", color = Color.White, fontSize = 50.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(vertical = 6.dp))
            Text(product.name, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
            Text("mode=live · RFID ikke bundet ennå · 8 sek", color = Color.White.copy(alpha = 0.90f), fontSize = 11.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 12.dp))
        }
    }
}

private suspend fun registerStockLive(productKey: String): RegisterResult = withContext(Dispatchers.IO) {
    val url = URL("$SUPABASE_URL/rest/v1/rpc/florivo_terminal_register_stock")
    val connection = (url.openConnection() as HttpURLConnection).apply {
        requestMethod = "POST"
        connectTimeout = 10000
        readTimeout = 10000
        doOutput = true
        setRequestProperty("Content-Type", "application/json")
        setRequestProperty("Accept", "application/json")
        setRequestProperty("apikey", SUPABASE_PUBLISHABLE_KEY)
    }

    val payload = JSONObject()
        .put("p_mode", MODE)
        .put("p_product_key", productKey)
        .put("p_device_id", DEVICE_ID)
        .put("p_employee_name", JSONObject.NULL)
        .toString()

    connection.outputStream.use { it.write(payload.toByteArray(Charsets.UTF_8)) }

    val code = connection.responseCode
    val stream = if (code in 200..299) connection.inputStream else connection.errorStream
    val body = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
    connection.disconnect()

    if (code !in 200..299) {
        throw IllegalStateException("HTTP $code ${body.take(160).replace('\n',' ')}")
    }

    val array = JSONArray(body)
    if (array.length() == 0) throw IllegalStateException("Tomt serversvar")
    val row = array.getJSONObject(0)
    RegisterResult(displayNumber = row.optString("display_number", "------"))
}
